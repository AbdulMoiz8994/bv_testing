#!/usr/bin/env node

/**
 * Pa11y accessibility scan.
 *
 * Usage: node run-pa11y.js <url>
 *
 * Runners. Pa11y is a wrapper and accepts more than one engine in a single
 * pass, merging the results. PA11Y_RUNNER takes a comma separated list.
 *
 *   htmlcs        HTML CodeSniffer. Standards stop at WCAG 2.0. Noisier.
 *   axe           axe-core. Covers WCAG 2.0, 2.1 and 2.2 at A and AA.
 *   htmlcs,axe    Both. Published comparisons put the combined yield above
 *                 either alone, because each finds issues the other misses.
 *
 * Note on the standard option below: it governs HTML CodeSniffer. Whether it
 * also caps which axe rules run inside Pa11y has not been verified here.
 * For guaranteed 2.1 and 2.2 coverage, SCAN_ENGINE=AXE uses run-axe.js, which
 * requests the version tags explicitly.
 *
 * Navigation note: pa11y injects its test runner into the page immediately
 * after load. On sites that redirect or navigate client side after first
 * paint, the page can be replaced mid injection, producing
 * "Execution context was destroyed, most likely because of a navigation".
 *
 * Two mitigations are applied. Server side redirects are resolved before the
 * scan so pa11y is given the final address. The transient race is retried.
 *
 * Neither can fully control pa11y's internal injection timing. For sites that
 * fail repeatedly, run-axe.js is the more reliable engine because it waits for
 * the network to settle before injecting.
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

const MAX_ATTEMPTS = parseInt(process.env.SCAN_MAX_ATTEMPTS || "3", 10);
const SETTLE_MS = parseInt(process.env.SCAN_SETTLE_MS || "2000", 10);
const TIMEOUT_MS = parseInt(process.env.SCAN_TIMEOUT_MS || "60000", 10);
// Hard ceiling across all attempts. Without it, three lengthening attempts on a
// slow site could hold a worker for six minutes.
const BUDGET_MS = parseInt(process.env.SCAN_TOTAL_BUDGET_MS || "150000", 10);

/** Transient failures worth another attempt. A slow site often loads on a
 *  second try, and a page that navigated mid injection usually settles. */
function isRetryable(e) {
  const m = String((e && e.message) || e);
  return (
    // the page was replaced while the runner was being injected
    m.includes("Execution context was destroyed") ||
    m.includes("Target closed") ||
    m.includes("Session closed") ||
    m.includes("frame was detached") ||
    // the page did not finish loading in time
    m.includes("Navigation timeout") ||
    m.includes("TimeoutError") ||
    m.includes("net::ERR_")
  );
}

/** Follow server side redirects so pa11y is given the final address. */
function resolveFinalUrl(target, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects >= 5) return resolve(target);
    let parsed;
    try {
      parsed = new URL(target);
    } catch (e) {
      return resolve(target);
    }
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.request(
      target,
      {
        method: "HEAD",
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0 AccessibilityAudit/1.0" },
      },
      (res) => {
        res.resume();
        const code = res.statusCode || 0;
        if (code >= 300 && code < 400 && res.headers.location) {
          const next = new URL(res.headers.location, target).toString();
          return resolve(resolveFinalUrl(next, redirects + 1));
        }
        resolve(target);
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(target);
    });
    req.on("error", () => resolve(target));
    req.end();
  });
}

(async () => {
  const url = process.argv[2];

  if (!url) {
    console.error("Provide a URL as an argument");
    process.exit(1);
  }

  const pa11y = require("pa11y");
  // Comma separated, so one setting can select one engine or both.
  const runners = String(process.env.PA11Y_RUNNER || "htmlcs,axe")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const target = await resolveFinalUrl(url);

  const startedAt = Date.now();
  let lastError;

  for (let i = 1; i <= MAX_ATTEMPTS; i += 1) {
    const remaining = BUDGET_MS - (Date.now() - startedAt);
    if (remaining <= 5000) break;

    try {
      const results = await pa11y(target, {
        chromeLaunchConfig: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        },
        standard: "WCAG2AA",
        runners,
        // Programmatic option names. The command line flag "level" has no
        // effect when pa11y is used as a library, so notices and warnings
        // were previously dropped with no error.
        includeNotices: process.env.PA11Y_INCLUDE_NOTICES === "true",
        includeWarnings: process.env.PA11Y_INCLUDE_WARNINGS !== "false",
        // Each attempt gets longer, so a site that is merely slow succeeds on a
        // later try rather than failing three times at the same limit.
        timeout: Math.min(TIMEOUT_MS * i, remaining),
        wait: SETTLE_MS,
      });

      // Preserve the address actually scanned when a redirect was followed.
      if (target !== url) results.requestedUrl = url;

      // Record which engines produced this result, so a report can state it.
      results.runnersUsed = runners;

      console.log(JSON.stringify(results));
      return;
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || i === MAX_ATTEMPTS) break;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }

  console.error(lastError);
  process.exit(1);
})();
