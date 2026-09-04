#!/usr/bin/env node

/**
 * URL and subdomain discovery.
 *
 * Sitemap based only. Does not crawl. Does not query certificate
 * transparency logs. Only discovers what the site publishes.
 *
 * Usage:  node run-discovery.js <url> [submittedUrl ...]
 *
 * The first argument is the primary domain to discover.
 * Any further arguments are the submitted URLs, used to set inScope.
 *
 * Output: a single JSON object on stdout matching the structure in
 *
 * Exit code is always 0 when the module completes, including when nothing
 * is found. Discovery is additive and must never block an audit.
 */

const https = require("https");
const http = require("http");
const zlib = require("zlib");
const { URL } = require("url");

const MAX_URLS = parseInt(process.env.MAX_URLS || "100", 10);
const MAX_DEPTH = parseInt(process.env.DISCOVERY_MAX_DEPTH || "3", 10);
const TIMEOUT_MS = parseInt(process.env.DISCOVERY_TIMEOUT_MS || "10000", 10);
const MAX_SECONDS = parseInt(process.env.DISCOVERY_MAX_SECONDS || "120", 10);

const startedAt = Date.now();
const limitsHit = [];

function timeRemaining() {
  return MAX_SECONDS * 1000 - (Date.now() - startedAt);
}

function noteLimit(name) {
  if (!limitsHit.includes(name)) limitsHit.push(name);
}

/**
 * Fetch a URL. Follows up to 5 redirects. Decompresses gzip.
 * Resolves to { status, body } or { status, body: null } on failure.
 */
function fetch(target, redirects = 0) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(target);
    } catch (e) {
      return resolve({ status: 0, body: null });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return resolve({ status: 0, body: null });
    }

    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(
      target,
      {
        timeout: Math.min(TIMEOUT_MS, Math.max(timeRemaining(), 1000)),
        headers: {
          "User-Agent": "AccessibilityAudit/1.0 (+discovery)",
          "Accept-Encoding": "gzip, deflate",
        },
      },
      (res) => {
        const status = res.statusCode || 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (redirects >= 5) return resolve({ status, body: null });
          const next = new URL(res.headers.location, target).toString();
          return resolve(fetch(next, redirects + 1));
        }

        if (status !== 200) {
          res.resume();
          return resolve({ status, body: null });
        }

        let stream = res;
        const encoding = (res.headers["content-encoding"] || "").toLowerCase();
        if (encoding === "gzip") stream = res.pipe(zlib.createGunzip());
        else if (encoding === "deflate") stream = res.pipe(zlib.createInflate());
        else if (target.endsWith(".gz")) stream = res.pipe(zlib.createGunzip());

        const chunks = [];
        let size = 0;
        stream.on("data", (c) => {
          size += c.length;
          if (size > 20 * 1024 * 1024) {
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        stream.on("end", () =>
          resolve({ status, body: Buffer.concat(chunks).toString("utf8") })
        );
        stream.on("error", () => resolve({ status, body: null }));
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, body: null });
    });
    req.on("error", () => resolve({ status: 0, body: null }));
  });
}

/** HEAD request used for reachability. Falls back to GET where HEAD is refused. */
function head(target) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(target);
    } catch (e) {
      return resolve(0);
    }
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.request(
      target,
      {
        method: "HEAD",
        timeout: Math.min(TIMEOUT_MS, Math.max(timeRemaining(), 1000)),
        headers: { "User-Agent": "AccessibilityAudit/1.0 (+discovery)" },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode || 0);
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(0);
    });
    req.on("error", () => resolve(0));
    req.end();
  });
}

/** Read Sitemap directives from robots.txt. */
async function sitemapsFromRobots(origin) {
  const res = await fetch(origin + "/robots.txt");
  if (!res.body) return [];
  const found = [];
  for (const line of res.body.split(/\r?\n/)) {
    const m = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
    if (m) found.push(m[1].trim());
  }
  return found;
}

/**
 * Parse a sitemap or sitemap index.
 * Returns { urls: [], sitemaps: [] }.
 */
function parseSitemap(xml) {
  const urls = [];
  const sitemaps = [];
  if (!xml) return { urls, sitemaps };

  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const locPattern = /<loc>\s*(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?\s*<\/loc>/gi;

  let m;
  while ((m = locPattern.exec(xml)) !== null) {
    const value = m[1].trim();
    if (!value) continue;
    if (isIndex) sitemaps.push(value);
    else urls.push(value);
  }
  return { urls, sitemaps };
}

/** Normalize for deduplication. Strips fragment, keeps query, trims trailing slash. */
function normalize(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch (e) {
    return null;
  }
}

/** Registered domain, approximated as the last two labels. */
function registeredDomain(hostname) {
  const host = hostname.toLowerCase();

  // IP addresses have no registered domain. Return them whole so that an
  // address is only ever compared against itself.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
  if (host.includes(":")) return host;

  const parts = host.split(".");
  if (parts.length <= 2) return parts.join(".");
  const twoLevel = ["co.uk", "com.au", "co.nz", "co.jp", "com.br", "co.za", "org.uk", "ac.uk", "gov.uk"];
  const lastTwo = parts.slice(-2).join(".");
  if (twoLevel.includes(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return lastTwo;
}

async function main() {
  const primary = process.argv[2];
  const submitted = process.argv.slice(3);

  const result = {
    discoverySummary: {
      totalUrlsDiscovered: 0,
      totalSubdomainsDiscovered: 0,
      depthReached: 0,
      limitsHit: [],
    },
    discoveredUrls: [],
    discoveredSubdomains: [],
  };

  if (!primary) {
    result.discoverySummary.limitsHit.push("no primary url supplied");
    process.stdout.write(JSON.stringify(result));
    return;
  }

  let base;
  try {
    base = new URL(primary);
  } catch (e) {
    result.discoverySummary.limitsHit.push("primary url is not valid");
    process.stdout.write(JSON.stringify(result));
    return;
  }

  const origin = base.origin;
  const rootDomain = registeredDomain(base.hostname);

  const submittedSet = new Set(
    submitted.map((u) => normalize(u)).filter(Boolean)
  );

  // Collect sitemap entry points
  let queue = await sitemapsFromRobots(origin);
  if (queue.length === 0) queue = [origin + "/sitemap.xml"];

  const seenSitemaps = new Set();
  const urlSet = new Set();
  let depth = 0;
  let capped = false;

  while (queue.length > 0 && depth < MAX_DEPTH && !capped) {
    if (timeRemaining() <= 0) {
      noteLimit("discovery time limit reached");
      break;
    }

    depth += 1;
    const nextQueue = [];

    for (const sitemapUrl of queue) {
      if (timeRemaining() <= 0) {
        noteLimit("discovery time limit reached");
        break;
      }
      const key = normalize(sitemapUrl) || sitemapUrl;
      if (seenSitemaps.has(key)) continue;
      seenSitemaps.add(key);

      const res = await fetch(sitemapUrl);
      const { urls, sitemaps } = parseSitemap(res.body);

      for (const u of urls) {
        const n = normalize(u);
        if (!n) continue;
        let host;
        try {
          host = new URL(n).hostname;
        } catch (e) {
          continue;
        }
        if (registeredDomain(host) !== rootDomain) continue;
        urlSet.add(n);
        if (urlSet.size >= MAX_URLS) {
          noteLimit("maximum urls reached");
          capped = true;
          break;
        }
      }

      if (capped) break;
      nextQueue.push(...sitemaps);
    }

    queue = nextQueue;
    if (queue.length > 0 && depth >= MAX_DEPTH) {
      noteLimit("maximum depth reached");
    }
  }

  const allUrls = Array.from(urlSet);

  result.discoveredUrls = allUrls.map((u) => ({
    url: u,
    statusCode: null,
    inScope: submittedSet.has(u),
  }));

  // Subdomains are the distinct hostnames appearing in the sitemap,
  // excluding the primary host. Nothing is probed that the site did not publish.
  const hostnames = new Map();
  for (const u of allUrls) {
    try {
      const h = new URL(u).hostname.toLowerCase();
      if (h === base.hostname.toLowerCase()) continue;
      if (!hostnames.has(h)) hostnames.set(h, u);
    } catch (e) {
      continue;
    }
  }

  for (const [hostname, sampleUrl] of hostnames) {
    if (timeRemaining() <= 0) {
      noteLimit("discovery time limit reached");
      break;
    }
    const rootUrl = new URL(sampleUrl).origin;
    const status = await head(rootUrl);
    result.discoveredSubdomains.push({
      subdomain: hostname,
      url: rootUrl,
      reachable: status >= 200 && status < 400,
    });
  }

  result.discoverySummary.totalUrlsDiscovered = result.discoveredUrls.length;
  result.discoverySummary.totalSubdomainsDiscovered =
    result.discoveredSubdomains.length;
  result.discoverySummary.depthReached = depth;
  result.discoverySummary.limitsHit = limitsHit;

  process.stdout.write(JSON.stringify(result));
}

main().catch((e) => {
  process.stdout.write(
    JSON.stringify({
      discoverySummary: {
        totalUrlsDiscovered: 0,
        totalSubdomainsDiscovered: 0,
        depthReached: 0,
        limitsHit: ["discovery failed: " + (e && e.message ? e.message : "unknown")],
      },
      discoveredUrls: [],
      discoveredSubdomains: [],
    })
  );
});
