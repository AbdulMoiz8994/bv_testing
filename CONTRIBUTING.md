CONTRIBUTING ACCESS



For this engagement you have access to this testing repository and to the sandbox environment. There is no access to the internal repository and none to the live system, and you are not deploying anything. Your work is setting up the sandbox test site, wiring the update into it, testing it and reporting what you find.





BEFORE STARTING



Read START\_HERE.md, then docs/SANDBOX\_SETUP.md, then docs/TEST\_PLAN.md. If anything about scope is ambiguous, ask rather than assume.





WHAT YOU DELIVER



Findings, not merged code. Three things.



First, a written record of every test case you run, using the result table in docs/TEST\_PLAN.md. Mark each one pass, fail or blocked and write down what you actually observed rather than what the case said should happen. Can also provide in video walk through.



Second, a video walkthrough showing the process and the results. A screen recording is fine. Narrate what you are doing and what you are seeing as you go.



Third, screenshots of anything a written line cannot carry on its own, such as a rendered report, an execution log, an error message or a monitoring panel.



Put the written record and the screenshots in this repository. Share the video in Trello. Name every file so the test case it belongs to is obvious.





EVIDENCE THAT IS USEFUL



Record what you observed, not what you expected. If a test case says a report should exclude something and it does not, the screenshot of that report is the finding.

Include the Run ID wherever the system produces one, include timestamps and include the exact setting values that were in use when something behaved unexpectedly, with any secret removed.

If something looks wrong but might be deliberate, say so rather than changing it. Unwired switch branches are intentional and optional provider nodes are unconfigured on purpose.





WHAT NOT TO DO



Do not change workflow logic to make a test pass. Report the failure instead.

Do not reconfigure the environment beyond what a test case asks for. If a case requires a setting to change, note the value before and after.



SECRETS



Never commit an environment file, a Caddyfile, a compose override, a credential file, an API key, a token or user data. Redact credentials and internal addresses from screenshots and video before sharing anything.



The Grafana contact points file is committed deliberately. It holds no secret, because the alert address comes from ALERT\_EMAIL\_TO in the environment and Grafana refuses to start when the file is missing.



If a secret is exposed, raise it immediately. Deleting it later does not clear history and the credential has to be rotated.





WRITING STANDARD



Write so that someone who was not present can act on what you wrote without asking a follow up question. State impact before mechanism, separate what you verified from what you are estimating and expand an abbreviation the first time it appears.

