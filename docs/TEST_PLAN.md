TEST PLAN, ACCESSIBILITY AUTOMATION



Who this is for: anyone testing the system. No prior knowledge of it is assumed. Where to run it: the sandbox, wired up following SANDBOX\_SETUP.md. Nothing here reaches the live system or a real client.





SCOPE FOR THIS ENGAGEMENT



The system already works. This update changed five things, and those are what needs verifying. Run these cases, in this order, roughly 2 hours:



* TC-00. verifies The new scan engine runs in this environment. Always first.
* TC-14. verifies Retired criteria are excluded and counts are correct.
* TC-16. verifies All Jurisdictions returns 18 laws including ADA.
* TC-10. TC-11. TC-12. verifies Reports group, list specific fixes and print completely.
* TC-25. to TC-28. verifies Discovery. Built and wired. Subdomain discovery only finds subdomains the sitemap already references.
* TC-01. TC-06. verifies The form and scheduled paths still work.



The remaining cases are a full acceptance pass. They are written and available, but are not part of this engagement unless asked for.





BEFORE YOU START



You need, from the LastPass testing folder:



* The sandbox scan page address
* The sandbox n8n login
* Access to the sandbox spreadsheet
* Access to the mailbox that receives reports
* The sandbox Grafana login, needed for section G only



Regression baselines. These four were scanned with Pa11y and HTML CodeSniffer in August 2026. Axe tests more criteria, so counts will differ. Use them to sanity check the engine still produces sensible output, not as pass criteria.



* https://www.vsu.edu/, pa11y count 8, what it is useful for Small, stable, all one criterion. The smoke test in TC-00.
* https://micromentor.org/, pa11y count 99 reported, 31 real, what it is useful for 68 were retired WCAG 4.1.1. Proves the exclusion works.
* https://www.getcarbonrei.com/, pa11y count 13, what it is useful for Scanned with the United States profile.
* https://themomproject.com/, pa11y count 0, what it is useful for Returned zero, which is not credible. See TC-15b.





These are not jurisdiction tests. The jurisdiction list in a report is derived from the WCAG criterion found and the profile selected, never from where a site is hosted or who owns it. A German site and a US site with the same contrast failure produce identical jurisdiction lists. Profile coverage is tested in TC-16 by scanning one URL under each profile.



Where regional URLs do matter is engine robustness. Sites from different regions break scanners in ways US sites do not and none of that is currently covered. See TC-04c.





Two habits worth keeping:



1. Record evidence for every test. Screenshot the result and note the Run ID and the time. Without a Run ID, nobody can trace a failure back to what happened.
2. When something fails, stop and write it down before moving on. A later test may pass only because an earlier one left the system in an odd state and that detail is what makes the failure reproducible.



Finding a Run ID: it appears in the report email, in the run\_id column of the spreadsheet and inside the report page itself.





SECTION 0. FIRST RUN AFTER WIRING



Do this before any other test. It takes two minutes and closes the largest unknown in the deployment.



TC-00. Confirm the scan engine works in this environment



SCAN\_ENGINE now defaults to AXE. Until this test passes, axe has never executed on this server, every previous scan used Pa11y with HTML CodeSniffer.



1. Open the sandbox scan page
2. Enter a mailbox you can read
3. Leave the jurisdiction as All jurisdictions
4. Enter exactly this URL: https://www.vsu.edu/





1. Submit



Expected

* \[ ] A report is produced. It does not fail with a missing module error.
* \[ ] The report Engine field names axe, not pa11y htmlcs
* \[ ] The violation count is greater than zero
* \[ ] The Jurisdictional Compliance Impact section lists 18 laws
* \[ ] ADA appears in that list



Why this URL. It has a Pa11y baseline of 8 violations, all WCAG 1.4.3 contrast, from a scan on 2026-06-08. Axe tests more criteria, so a higher number is expected and correct. What matters here is that a report is produced at all.



Record: the violation count, for comparison against the 8 baseline.



If it fails with a missing module error



Set SCAN\_ENGINE=PA11Y and restart. Everything else in this plan still works and Pa11y with PA11Y\_RUNNER=htmlcs,axe gives good coverage in the meantime. Report the exact error text, it means the axe script cannot resolve its dependencies in this container.



Do not spend time debugging it. Switch back and carry on with the rest of the plan.





SECTION A. FORM SUBMISSION (THE ON-DEMAND PATH)



TC-01. Single URL, happy path



1. Open the sandbox scan page
2. Enter a mailbox address you can read
3. Enter one URL you know has accessibility problems
4. Submit





Expected



* \[ ] The page confirms the request was sent
* \[ ] Within \~2 minutes an email arrives, subject beginning ✅ Accessibility Report Saved
* \[ ] The email shows a URL, a violation count and an Open Report link
* \[ ] The link opens a report page, it does not say "No report file available"
* \[ ] A new row appears in the spreadsheet Reports tab
* \[ ] That row's report\_link matches the link in the email



Record: Run ID · time submitted · time email arrived · screenshot



⚠️ "No report file available" means the report file could not be stored. That is the file-storage step, not the email step.





TC-02. Multiple URLs Submit three different URLs in one request.



* \[ ] Three separate report emails arrive (one per URL)
* \[ ] Three new rows in the Reports tab
* \[ ] All three share the same Run ID
* \[ ] One run-summary email also arrives, subject beginning 📊 Accessibility Run Summary
* \[ ] One new row in the Runs tab, urls = 3





TC-03. Clean site Submit a URL with few or no known problems.



* \[ ] The report still arrives
* \[ ] Violation count is 0 or very low
* \[ ] The report page renders without blank sections or error text





TC-04. Bad input Try each of these separately:



* Empty URL box, expected: Form refuses to submit.
* not-a-website, expected: Form shows an error.
* ftp://example.com, expected: Form shows an error.
* Valid URL, empty email, expected: Form refuses to submit.
* notanemail in email box, expected: Form shows an error.
* \[ ] No error causes a blank page or a spinner that never stops
* \[ ] No invalid submission reaches n8n (check Executions, no new run appears)





TC-04b. Site that redirects or loads content after first paint



Scan a large news or media site, for example a major newspaper article page.



* \[ ] The scan completes rather than failing
* \[ ] If it fails, the error is not "Execution context was destroyed"
* \[ ] Retries are visible in the execution log if the first attempt failed



Sites that navigate after first paint used to break the scanner outright. Both scan scripts now settle before injecting and retry up to three times. If a site still fails, switch SCAN\_ENGINE to AXE, which controls injection timing more reliably.



TC-04c. Regional and structural robustness



Pick one URL for each row below and scan it. The point is not the violation count; it is whether the scan completes and produces a sensible report.



* Cookie or consent wall, why it breaks scanners The scanner tests the consent overlay instead of the page. Very common on EU sites., suggested source Any large EU commercial site.
* Right to left text, why it breaks scanners Direction handling and contrast detection on mirrored layouts, suggested source An Israeli or Arabic language site.
* CJK characters, why it breaks scanners Character encoding and font contrast measurement, suggested source A Japanese site.
* Accented and non-ASCII text, why it breaks scanners Encoding in the report and in the CSV, suggested source A French or Spanish site.
* Client rendered, heavy JavaScript, why it breaks scanners The page is tested before it finishes rendering, suggested source A single page application.
* Government or public sector, why it breaks scanners Legally required to be accessible, so a very low count is expected and correct, suggested source Any national government portal.





For each:



* \[ ] The scan completes rather than timing out
* \[ ] The report renders without broken characters or empty sections
* \[ ] Non-ASCII text appears correctly in the report and in the spreadsheet row
* \[ ] A consent wall does not produce a report describing only the overlay
* \[ ] A government site returning a very low count is not treated as a failure



A consent wall is the most likely of these to produce a misleading report. If the scan returns a handful of violations that all reference the consent overlay, the page itself was never tested. Record the URL and raise it.



TC-05. Unreachable site Submit https://this-domain-does-not-exist-999.com.



* \[ ] The system does not hang, it finishes within a few minutes
* \[ ] Either an error email arrives or a row appears in the Errors tab (ideally both)
* \[ ] The failure does not stop other URLs in the same batch





SECTION B. SCHEDULED DAILY RUN



TC-06. Scheduled run fires



1. In the sandbox spreadsheet URLs tab, add two or three addresses
2. Confirm the owner column holds a mailbox you can read
3. Wait for the scheduled time, or ask for the run to be triggered manually



Expected



* \[ ] A run appears in n8n → Executions at the scheduled time
* \[ ] It completes with a green status
* \[ ] One row per URL in the Reports tab
* \[ ] One row in the Runs tab
* \[ ] A run-summary email arrives



Record: exact time it fired · whether that matches your intended time zone



TC-07. Recipient comes from the right place



1. Change the owner value in the first data row of the URLs tab
2. Trigger the scheduled run
3. Note which address received the summary
* \[ ] Confirm whether the summary followed the changed cell



This test exists because the daily summary is currently addressed from one spreadsheet cell rather than a setting. If it has since been moved to a configured address, that address should receive it instead and this test should be updated to match.



TC-08. Empty URL list Clear all URLs from the URLs tab, then trigger the run.



* \[ ] The run does not crash
* \[ ] Either no email is sent, or an email states zero URLs
* \[ ] No malformed row is written to any tab





SECTION C. REPORT CONTENT



TC-09. Report structure Open any generated report and confirm each section is present and populated:



* \[ ] URL, Run ID, Engine, Mode, Timestamp, all filled, none blank or showing -
* \[ ] Total violations, with the high / medium / low split
* \[ ] Violations grouped by rule, each showing impact, description and the element affected
* \[ ] Jurisdictional Compliance Impact
* \[ ] Findings by Jurisdiction table
* \[ ] Remediation Guidance





TC-10. Remediation guidance is present and grouped



Every report must carry guidance. A report that names problems without saying how to address them is missing the part a reader needs.



* \[ ] A Remediation Guidance section is present, whatever criteria were found
* \[ ] Each criterion appears once, not once per finding
* \[ ] Each block shows a finding count, for example "8 findings"
* \[ ] A summary table above the blocks lists criterion, findings and high count
* \[ ] Blocks are ordered with the most high-impact criterion first



Previously this section was omitted entirely when a criterion had no library entry. Scan a page whose violations are outside contrast and confirm guidance still appears.



TC-11. Guidance is actionable



* \[ ] Each block contains an Apply these changes table
* \[ ] The table lists the specific change and every element it applies to
* \[ ] Identical changes are grouped into one row with a count
* \[ ] Different problems under the same criterion stay on separate rows



A contrast scan should reduce to a small number of rows such as "change text color to #e8741f, 7 elements", rather than repeating one instruction per element.



TC-12. Report prints completely



The most important case in this section. Collapsed sections must appear in a PDF without anyone expanding them first.



1. Open a report with violations
2. Do not click anything to expand
3. Press Ctrl+P, or Cmd+P and save as PDF
4. Open the saved PDF
* \[ ] Every violation detail appears
* \[ ] Every remediation block appears, fully expanded
* \[ ] The jurisdiction table appears
* \[ ] No section is empty or missing
* \[ ] Tables are not split awkwardly across pages



Before this was fixed, an unexpanded save produced a PDF with headings and no content and nothing indicated anything was missing.





TC-13. Attribution present



* \[ ] A line above the guidance section credits W3C and links the Document License
* \[ ] Requirement and technique text is not paraphrased





TC-14. Retired criteria do not appear



Scan a site with duplicate element identifiers. micromentor.org produced 68 such findings under Pa11y.



* \[ ] The headline total excludes findings for WCAG 4.1.1
* \[ ] No WCAG 4.1.1 rule appears anywhere in the report
* \[ ] The grouped violations table shows the same number as the headline total



Under the previous behavior this site reported 99 failures. 31 is correct.





TC-15. Clean site



Scan a page with no violations.



* \[ ] The report shows a No violations found result, not an empty table
* \[ ] It names the scan engine
* \[ ] It notes that automated testing covers a portion of issues and manual review is recommended





TC-15b. A site that previously returned zero



Scan this URL:



&#x20;   https://themomproject.com/





Under Pa11y it returned 0 violations, in the same run where micromentor.org returned 99. That is not credible for a commercial marketing site and the likely cause is a client rendered page tested before it finished rendering.



* \[ ] Under axe, the violation count is greater than zero



If it still returns zero, do not pass this case. Open the URL in a browser and check it with WAVE or the axe DevTools extension. If those find violations and the scan does not, the scanner is not seeing the rendered page and a false clean report would reach a client. Report it as Critical.





TC-16. Compliance mapping



Scan the same URL under each profile. One URL is sufficient; the jurisdiction list depends on the profile and the criterion found, not on the site. https://www.vsu.edu/ works well because all its findings are one criterion.



* \[ ] All Jurisdictions lists 18 laws for a universally applicable criterion
* \[ ] ADA, CVAA, EAA and Equality Act 2010 all appear under All Jurisdictions
* \[ ] United States lists Section 508, ADA and CVAA only
* \[ ] All Jurisdictions is a superset of every individual profile
* \[ ] No law appears twice, in particular JIS X 8341-3



TC-17. AI mode Ask for the same URL to be run twice, once with the AI setting off and once on.



* \[ ] With AI off: report shows Mode: Rule-based (OFF) and the plan sections still populate
* \[ ] With AI on: report shows an AI mode and includes Summary, Prioritized Overview, Suggested Fixes, QA Checklist
* \[ ] With AI on: no section is blank, garbled, or shows raw code
* \[ ] ai\_cost\_usd in the Runs tab is a sensible number



Blank or garbled AI sections usually mean the AI returned malformed output. Note which provider and model were in use, that is the key detail.



TC-18. WCAG version



* \[ ] Confirm which WCAG version is being scanned
* \[ ] The version stated in the report matches what is actually scanned
* \[ ] If reports claim 2.1 or 2.2, spot-check that at least one 2.1-or-later criterion can appear





SECTION D. ERROR HANDLING



TC-19. Error alert reaches a human Break one credential deliberately. Google Sheets is a good choice.



* \[ ] An error email arrives, subject beginning 🚨 \[n8n Error]
* \[ ] It names the workflow and the step that failed
* \[ ] A row appears in the Errors tab
* \[ ] Both happen, an email with no row or a row with no email, is a fail



The error path previously lost the log entry whenever the email failed. Both must land independently.



TC-20. Error workflows do not themselves error After TC-19, open n8n → Executions.



* \[ ] The error-handling runs show green, not red
* \[ ] None finished in under half a second (that pattern indicates a settings failure, not real work)



TC-21. Recovery Restore the credential broken in TC-19 and submit a normal scan.



* \[ ] The system works again with no restart
* \[ ] No leftover error emails continue arriving





SECTION E. CONFIGURATION SWITCHING



The system is designed to be switched between providers without rebuilding. Change each setting, then verify.



TC-22. Scan engine



* \[ ] Switching between Pa11y and axe produces a working report from both
* \[ ] The report's Engine field reflects the one actually used



TC-23. Storage target



* \[ ] With storage set to Sheets, rows are written and the report link works
* \[ ] Switching does not break the report link



TC-24. Notification channels



* \[ ] With email only: email arrives, nothing posts to Slack
* \[ ] With email and Slack: both arrive
* \[ ] With Slack only: Slack posts, no email
* \[ ] With the setting blank: nothing is sent and nothing crashes





SECTION F. URL AND SUBDOMAIN DISCOVERY



Built and wired. Subdomain discovery is narrower than originally specified: it only finds subdomains the target site already references in its sitemap.



TC-25. Sitemap discovery. Discovery has two modes and they behave differently. Test whichever applies and do not expect the other's behavior.



Reporting mode, the checkbox on the form or SHOW\_DISCOVERY\_IN\_REPORT=true. Lists what the site publishes and adds no scans.



* \[ ] Multiple pages are discovered and listed in the discovery section
* \[ ] Duplicates are removed
* \[ ] Pages that were actually submitted show In Scope Yes, not every row reading No
* \[ ] No extra scans occur, so report emails match pages submitted, not pages discovered





Input expansion mode, INPUT\_SOURCE=SITEMAP SCAN on the scheduled run. Expands the seed URL and scans what it finds.



* \[ ] Each discovered page is scanned
* \[ ] The count respects the maximum URL limit
* \[ ] Duplicates are removed





TC-26. Subdomain discovery. Submit a domain whose sitemap references subdomains. A subdomain absent from the sitemap will not be found, correctly.



* \[ ] Subdomains referenced in the sitemap are discovered and reported
* \[ ] Only subdomains of the requested domain appear, nothing unrelated
* \[ ] Unreachable subdomains are skipped without stopping the run





TC-27. Discovery edge cases



* Site with no sitemap, expected: Falls back gracefully, still scans the given URL.
* Site with a very large sitemap, expected: Caps at the limit, does not hang.
* Site blocking crawlers, expected: Handles it cleanly, reports why.





TC-28. Discovery limits



* \[ ] A run cannot exceed the configured maximum URLs
* \[ ] A large discovery run completes in a reasonable time
* \[ ] It does not exhaust the AI provider's rate limit mid-run







SECTION G. MONITORING



TC-29. Grafana



* \[ ] Grafana loads at its address
* \[ ] You can log in
* \[ ] The n8n Monitoring dashboard opens
* \[ ] Charts show data, not "No data" everywhere
* \[ ] No alert is firing while the system is healthy



TC-30. Prometheus



* \[ ] Prometheus loads and asks for a username and password
* \[ ] The targets page shows everything as UP





TC-31. Alerts reach someone Stop a service briefly, then restart it.



* \[ ] An alert email arrives
* \[ ] It names what is wrong
* \[ ] Restarting the service clears the alert







REPORTING A PROBLEM



Use this format. A report with a Run ID and a screenshot can be traced immediately. One without usually cannot.



&#x20;   TEST CASE:      TC-\_\_
    DATE / TIME:
    ENVIRONMENT:    Sandbox

    WHAT I DID:
      1.
      2.

    WHAT I EXPECTED:

    WHAT ACTUALLY HAPPENED:

    RUN ID:
    EXECUTION ID:        (n8n → Executions → the row's ID)
    URL TESTED:
    SCREENSHOTS:         attached

    DOES IT HAPPEN EVERY TIME?   yes / no / didn't retry
    ANYTHING ELSE:





Severity



* Critical, meaning: Core function unusable, examples No reports generated; no emails at all; data written to production.
* High, meaning: Major feature broken, examples Report link dead; compliance section missing; errors silent.
* Medium, meaning: Works but wrong, examples Duplicated guidance; wrong time zone; jurisdiction list mismatched.
* Low, meaning: Cosmetic, examples Formatting; wording.





SIGN-OFF



A pass means every Critical and High case passes and any Medium or Low failures are logged and accepted.



* 0\. First run, TC-00, result ☐ Pass ☐ Fail.
* A. Form submission, TC-01 to TC-05, result ☐ Pass ☐ Fail.
* B. Scheduled run, result ☐ Pass ☐ Fail.
* C. Report content, TC-09 to TC-18, result ☐ Pass ☐ Fail.
* D. Error handling, TC-19 to TC-21, result ☐ Pass ☐ Fail.
* E. Configuration, TC-22 to TC-24, result ☐ Pass ☐ Fail.
* F. Discovery, TC-25 to TC-28, result ☐ Pass ☐ Fail.
* G. Monitoring, TC-29 to TC-31, result ☐ Pass ☐ Fail.





Open issues at sign-off:

* &#x20;

