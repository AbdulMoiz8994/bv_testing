CONFIGURATION REFERENCE



Every setting in .env.sample, what it does and whether it is required.



A blank value under a disabled feature is expected. It is not an error.





BEHAVIOR SWITCHES



These decide how the system runs. They are read at execution time by switch nodes inside the workflows.





INPUT\_SOURCE



Where the scheduled workflow gets its URLs.



* SHEET, status: Connected. Reads the URLs tab.
* WEBHOOK, status: Branch exists, not connected.
* SITEMAP SCAN, status: Connected. Reads the URLs tab, then expands each seed URL into every page its sitemap publishes, capped by MAX\_URLS. Increases the number of scans.





The switch has no fallback output. Setting a value other than SHEET causes the scheduled run to complete having done nothing, with no error. Add a fallback output when convenient.





SCAN\_ENGINE



Default AXE.



* AXE, standard tested WCAG 2.0, 2.1 and 2.2 at A and AA, per WCAG\_TAGS, notes: Fewer false positives. Waits for the network to settle, so client rendered pages are measured correctly. Does not report the retired 4.1.1 criterion.
* PA11Y, standard tested Depends on PA11Y\_RUNNER, notes: With htmlcs alone, standards stop at WCAG 2.0 and retired 4.1.1 findings are emitted.



An unrecognized value falls back to AXE.





PA11Y\_RUNNER



Only used when SCAN\_ENGINE=PA11Y. Comma separated; Pa11y merges the results. Default htmlcs,axe.



* htmlcs, coverage WCAG 2.0 only, noisier.
* axe, coverage axe-core inside Pa11y.
* htmlcs,axe, coverage Highest raw coverage, since each engine finds issues the other misses.







Retired criteria



WCAG 4.1.1 Parsing was removed in WCAG 2.2. W3C advises treating it as always satisfied for HTML and XML, because assistive technology uses the accessibility tree the browser builds rather than parsing markup directly.



HTML CodeSniffer still reports it. Findings for retired criteria are dropped from reports entirely: not counted, not listed in the violations table, not mentioned. A criterion that cannot be failed does not belong in a compliance report. On one live scan this was the difference between 99 reported failures and 31 real ones.





AI\_MODE



* OFF, behavior: Rule based plans. No external calls, no cost, no rate limit.
* OPENAI, behavior: Any OpenAI compatible provider, per OPENAI\_API\_BASE.
* AZURE, behavior: Connected to Generate Azure Remediation Plan. Needs an Azure credential, endpoint, deployment and api version.
* CLAUDE, behavior: Connected to Generate Claude Remediation Plan. Needs an Anthropic credential, CLAUDE\_API\_BASE and CLAUDE\_MODEL.



This setting has the largest effect on throughput.





STORAGE\_TARGET



Where scan records are written.



* SHEETS, behavior: Spreadsheet. The setting in use today.
* CSV, behavior: A file on disk, then uploaded.
* S3, behavior: Reads and writes the reports CSV through Cloudinary, despite the name.
* AIRTABLE, behavior: Node in place. Add an Airtable credential and set the base and table ids.



This does not control the report file upload. That runs on every scan regardless.





METRICS\_TARGET



Where run summaries are written: SHEETS, AIRTABLE or CSV. The Airtable node is in place and needs a credential.





NOTIFY\_CHANNELS



Comma separated.



* email, status: Wired and in use.
* slack, status: Node in place. Add a Slack credential and set SLACK\_CHANNEL\_ID.
* sms, status: Provider agnostic branch. Attach whichever SMS node suits your provider.
* crm, status: Provider agnostic branch. Attach whichever node suits your platform, including Google Sheets.



Blank means no notifications are sent, which is valid and produces no error.





SCAN\_CONCURRENCY



Worker replicas started by make up. Each worker runs one job at a time, so this is the number of simultaneous scans.





MAX\_URLS



Maximum URLs accepted in one run. Also caps discovery.





N8N



* N8N\_PROTOCOL, required Yes, notes https in production.
* N8N\_HOST, required Yes, notes: Hostname only, no scheme.
* N8N\_PORT, required Yes, notes: 5678.
* WEBHOOK\_URL, required Yes, notes: Public base address. Used to build execution links in error emails.
* GENERIC\_TIMEZONE, required Yes, notes: Controls when schedule triggers fire. Without it n8n uses its own default.
* N8N\_ENCRYPTION\_KEY, required Yes, notes: Encrypts stored credentials. Changing or losing it makes every credential unreadable. Record before creating any credential.
* ALLOWED\_ORIGINS, required Yes, notes: Comma separated list of every address the form is served from. Must never be hardcoded into a workflow, because deployment URLs change.







DATABASE



DB\_USER, DB\_PASSWORD, DB\_NAME. All required. Used by Postgres, n8n and the Grafana Postgres datasource.





EMAIL RECIPIENTS



The per URL report goes to the address supplied in the submission. These two cover messages with no submitter.



* ALERT\_EMAIL\_TO, used by Error alerts. Referenced by both error workflows.
* REPORT\_EMAIL\_TO, used by Not currently read by any workflow. The daily summary takes its recipient from the owner column of the URLs tab, first data row, which is by design.



SMTP\_FROM is deliberately absent. The error workflows previously addressed alerts using it, which is a sender field, blank by default and unused elsewhere since all mail goes via Gmail. Change those nodes to ALERT\_EMAIL\_TO.





GOOGLE



Sheets and Gmail authenticate through credentials stored inside n8n. These settings are identifiers only.



* GOOGLE\_SHEETS\_ACCESSIBILITY\_RESULTS\_ID, what it identifies The workbook.
* GOOGLE\_SHEETS\_SHEET\_URLS\_ID, what it identifies URLs tab.
* GOOGLE\_SHEETS\_SHEET\_REPORTS\_ID, what it identifies Reports tab.
* GOOGLE\_SHEETS\_SHEET\_RUNS\_ID, what it identifies Runs tab.
* GOOGLE\_SHEETS\_SHEET\_ERRORS\_ID, what it identifies Errors tab.



Column names in these tabs end in a non breaking space, U+00A0, invisible in the interface. Retyping a header breaks the mapping silently, because the workflows match against the exact original header text.





AI PROVIDER



The workflow calls a standard chat completions endpoint. Any compatible provider works by changing three values and the key stored in n8n.





* OPENAI\_API\_BASE, notes: Endpoint base. Groq: https://api.groq.com/openai/v1.
* OPENAI\_MODEL, notes: Model name.
* OPENAI\_PROMPT\_COST\_PER\_M, notes: Set to 0 on a free tier.
* OPENAI\_COMPLETION\_COST\_PER\_M, notes: Set to 0 on a free tier.



These two values feed the ai\_cost\_usd column. Leaving paid prices set on a free tier makes that column report a cost that is not being charged.





REPORT FILE STORAGE





The upload runs on every scan and produces the shareable link. If it fails, the report email reads "No report file available" even when everything else succeeded.

The workflows use Cloudinary.





* CLOUDINARY\_CLOUD\_NAME, notes: Required. The account name from the Cloudinary dashboard.
* STORAGE\_API\_BASE, notes: Required. Upload endpoint base; STORAGE\_ACCOUNT and STORAGE\_UPLOAD\_PATH are appended. No provider is hardcoded in the workflows, so a blank value produces an empty upload URL and the upload is skipped.
* STORAGE\_ACCOUNT, notes: Optional. Account or bucket segment in the URL. Falls back to CLOUDINARY\_CLOUD\_NAME when unset. Prefer this name going forward.
* STORAGE\_UPLOAD\_PATH, notes: Optional. Path segment between the account and the object path. Cloudinary uses /raw/upload, which is the default.
* STORAGE\_UPLOAD\_PRESET, notes: Optional. Named upload configuration sent with each upload. Defaults to n8n\_reports.
* STORAGE\_PUBLIC\_BASE, notes: Optional. Public base used to build report links. Same fallback.



The endpoints are settings rather than literals, so the account, region or a compatible proxy can be repointed without editing a workflow. A provider with a different request shape would still need the three upload nodes adjusted.



An unsigned upload preset named exactly n8n\_reports must exist in that account and permit the raw resource type. Without it every upload fails while the spreadsheet row still writes, so the run looks successful.



There are no S3 or MinIO nodes in the workflows. If storage is ever moved, the S3 value of STORAGE\_TARGET is a naming leftover and also routes through Cloudinary.





DISCOVERY



Sitemap based. Does not crawl links. Does not query certificate transparency logs.



* DISCOVERY\_MAX\_DEPTH, default: 3, notes: Sitemap index nesting limit.
* DISCOVERY\_TIMEOUT\_MS, default: 10000, notes: Per request timeout.
* DISCOVERY\_MAX\_SECONDS, default: 120, notes: Total budget. Discovery returns what it found when reached.
* SHOW\_DISCOVERY\_IN\_REPORT, default false, notes: Controls rendering only. Data is always collected and stored.



A per request override may be supplied in the payload so a single report can include discovery without changing the global setting.





SCAN OPTIONS



* WCAG\_TAGS, notes: Comma separated axe-core tags. Blank uses the default covering 2.0, 2.1 and 2.2 at A and AA.
* PA11Y\_RUNNER, notes htmlcs or axe. htmlcs cannot test 2.1 or 2.2.
* PA11Y\_INCLUDE\_NOTICES, notes: Default false.
* PA11Y\_INCLUDE\_WARNINGS, notes: Default true.





NOTIFICATIONS



* SLACK\_CHANNEL\_ID, required when When NOTIFY\_CHANNELS includes slack. The node is already in place.
* TWILIO\_FROM\_NUMBER, required when If Twilio is the SMS provider you choose. Another provider would use its own settings.





AIRTABLE



Required only when STORAGE\_TARGET or METRICS\_TARGET is AIRTABLE: AIRTABLE\_BASE\_ID, AIRTABLE\_TABLE\_REPORTS\_ID, AIRTABLE\_TABLE\_RUNS\_ID, AIRTABLE\_TABLE\_ERRORS\_ID.



Issue the token from a shared account rather than a personal one. A personal access token stops working when that individual's account closes, and it grants access under their identity while it is active.





MONITORING



* GRAFANA\_ADMIN\_USER, notes: Grafana login.
* GRAFANA\_ADMIN\_PASSWORD, notes: Grafana login.
* PROMETHEUS\_USER, notes: Basic auth user.
* PROMETHEUS\_PASS\_HASH, notes: Generate with make hash-password PASSWORD='...'.
* GF\_SMTP\_ENABLED, notes: Set false unless an SMTP server is configured. Enabling with blank host and port produces a malformed configuration.
* SMTP\_HOST, SMTP\_PORT, SMTP\_USER, SMTP\_PASS, notes: Grafana alert mail only. Separate from the workflows, which use Gmail.





SETTINGS FOR OPTIONAL CAPABILITIES



Slack, Airtable, Azure and Claude have their nodes in place. Each needs a credential in n8n and its settings here. Blank is correct until enabled.



The sms and crm branches are provider agnostic. They carry no node because the provider is your choice; attaching one is the same pattern as the others.



AZURE\_OPENAI\_ENDPOINT, AZURE\_OPENAI\_DEPLOYMENT, AZURE\_OPENAI\_API\_VERSION, CLAUDE\_API\_BASE, CLAUDE\_MODEL, TWILIO\_FROM\_NUMBER, SLACK\_CHANNEL\_ID, AIRTABLE\_BASE\_ID, AIRTABLE\_TABLE\_REPORTS\_ID, AIRTABLE\_TABLE\_RUNS\_ID, AIRTABLE\_TABLE\_ERRORS\_ID, REPORT\_EMAIL\_TO





COMPLIANCE PROFILE



COMPLIANCE\_PROFILE sets the default jurisdiction profile when the submitted payload does not supply one. Blank means all jurisdictions.





Values: us, canada, eu, uk, japan, israel, australia, new\_zealand.



* blank, All Jurisdictions, laws reported for a universally applicable criterion All 18 laws.
* us, laws reported for a universally applicable criterion Section 508, ADA, CVAA.
* eu, laws reported for a universally applicable criterion EU Web Accessibility Directive, EN 301 549, EAA.
* uk, laws reported for a universally applicable criterion UK Public Sector Accessibility Regulations, Equality Act 2010.
* canada, laws reported for a universally applicable criterion AODA, ACA.
* japan, laws reported for a universally applicable criterion JIS X 8341-3 (Japan).
* israel, laws reported for a universally applicable criterion Israeli Standard 5568.
* australia, laws reported for a universally applicable criterion Australian DDA.
* new\_zealand, laws reported for a universally applicable criterion NZ Govt Web Accessibility Standard.



All Jurisdictions is a superset of every profile, so ADA, CVAA, EAA and the Equality Act appear there as well. Law names are deduplicated to one canonical spelling.

