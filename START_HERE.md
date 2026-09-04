START HERE



An update has been made to an accessibility scanning system that is already live. Your job is to set up a sandbox test site, wire that update into it and find out whether the updated system actually works. Every credential you need is in LastPass. For this engagement you do not touch the live system.



Read this page, then docs/SANDBOX\_SETUP.md, then docs/TEST\_PLAN.md. Nothing else is required reading.





WHAT THE SYSTEM DOES



Someone submits web addresses through a form. For each address the system scans the page against WCAG accessibility criteria, maps the findings to the accessibility laws that reference them, generates an HTML report, stores it, writes a row to a spreadsheet and sends reports to internal email only. There is also a scheduled run that does the same thing from a list in the spreadsheet.





Five workflows do this work.



* Workflow a receives a form submission, splits the list of addresses and aggregates the results at the end.
* Workflow b does the same thing on a schedule, reading its list from a spreadsheet.
* Workflow c scans one address and produces everything that follows from it. It has 69 nodes. It does not run on its own, because workflows a and b call it. That is correct and is not a fault to report.
* Error trigger global catches failures anywhere and sends an alert.
* Error notifier reusable is called by workflow c for failures it handles itself.





WHAT WORKFLOW C DOES, IN ORDER



Knowing this sequence is what lets you tell a real failure from expected behavior.



1. Choose the scan engine. Axe by default, Pa11y if selected. An unrecognized value falls back to axe.
2. Discovery, only when asked for. Reads the site's sitemap and lists what it publishes. Adds no scans.
3. Scan. A headless browser loads the page and collects violations.
4. Parse. Engine output is normalized into a common shape.
5. Choose the AI provider. When off, plans come from rules instead.
6. Build the plan. Summary, prioritized issues, suggested fixes, QA checklist.
7. Map findings to jurisdictional law.
8. Build the HTML report as one self-contained file.
9. Upload the report and produce the shareable link. This runs on every scan regardless of the storage setting.
10. Choose the storage target.
11. Write the record.
12. Choose notification channels.
13. Send notifications.
14. Return counts and cost to workflow a or b.





WHAT THIS UPDATE CHANGED



These five things are what you are verifying. Everything else in the system already worked.



1. The scan engine changed. It used Pa11y with HTML CodeSniffer. It now uses axe by default, which tests WCAG 2.1 and 2.2 criteria that were never checked before.
2. Retired criteria are excluded. WCAG 4.1.1 was removed from the standard. The system was counting findings for it. On one site that reported 99 failures when only 31 were real.
3. Jurisdiction coverage was wrong. Selecting All Jurisdictions returned fewer laws than selecting United States, and left out the ADA. It now returns all 18.
4. Reports were rewritten. Guidance groups by criterion instead of repeating for every finding, each block lists the specific change and the elements it applies to, and printing to PDF now captures collapsed sections without anyone expanding them first.
5. Discovery is new. The system can read a site's sitemap and list the other pages it publishes. In the mode the form checkbox turns on, it lists them without scanning them. There is a second mode on the scheduled run that does scan what it finds. TC-25 covers both and says which is which.





THINGS THAT LOOK WRONG AND ARE NOT



Several switch outputs have nothing attached, including SMS, CRM, Azure OpenAI, Claude and Airtable as an input. This is deliberate. Those capabilities exist as branches so they can be switched on later with a credential and a setting. An unwired branch is a decision, not unfinished work. Do not connect one and do not report one as a defect.

Blank values in the settings file are usually not errors either. The file documents every setting the system can use, including settings for providers that are switched off. CONFIGURATION.md marks which values are required and which belong to disabled features.



Workflow c not running on its own is correct, as described above.





TRAPS WORTH KNOWING BEFORE YOU START



Spreadsheet column headers end in an invisible non-breaking space. Retyping a header silently breaks the mapping. Do not rename the columns.



The report upload runs on every scan regardless of the storage setting. If it fails you get an empty report link and an email saying no report file is available, even though the spreadsheet row was written correctly.



n8n separates the draft you edit from the published version that runs. Editing and saving does not change what runs until you publish. An export defaults to the draft, so use the published flag when you want what is actually running.



Two files sharing one workflow identifier will overwrite each other. Keep one file per workflow.



Changing or losing the encryption key makes every stored credential unreadable.





WHAT YOU DELIVER



Findings, not merged code. A written record of every case, a video walkthrough and screenshots. CONTRIBUTING.md sets this out in full and is worth reading before you start rather than at the end.

