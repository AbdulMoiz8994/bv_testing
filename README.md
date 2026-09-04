ACCESSIBILITY AND COMPLIANCE AUTOMATION



Automated WCAG accessibility scanning with jurisdictional compliance mapping.



Someone submits one or more web addresses. The system scans each page, produces a remediation plan, maps findings to accessibility law across jurisdictions, generates an HTML report, logs the result and sends request using internal test email only.



This is the testing repository. For this engagement the work happens in a sandbox, not in the live system. Read START\_HERE.md first.





WHAT IS IN HERE



* START\_HERE.md, what the system does, what this update changed and what looks wrong but is not. Read this first.
* docs/SANDBOX\_SETUP.md, setting up the sandbox test site and wiring the update into it.
* docs/TEST\_PLAN.md, the 35 test cases, in the order to run them.
* docs/CONFIGURATION.md, every setting, what it does and which ones are required.
* CONTRIBUTING.md, what you deliver and how to record it.
* data/workflows/, the five workflow files to import.
* data/scripts/, the three scan scripts that run on the server.
* data/remediation-library.json, the WCAG guidance the reports draw on.
* grafana/ and prometheus.yml, the monitoring configuration.
* docker-compose.yml, Dockerfile and Makefile, the stack itself.





HOW BEHAVIOR IS CONTROLLED



Behavior comes from settings, not from code. Changing the scan engine, the AI provider, the storage target or the notification channels is a settings change. No provider is written into the workflows intentionally, which is why the storage address settings have to be filled in for reports to be stored at all.



Some switch outputs deliberately carry no node. Those capabilities are switched off, not missing. START\_HERE.md lists which ones and says not to connect them.





DRAFT AND PUBLISHED



n8n separates the version you edit from the version that runs. Editing and saving does not change what runs until you publish. An export defaults to the draft, so use the published flag when you want to capture what is actually running.

