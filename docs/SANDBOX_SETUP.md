SANDBOX SETUP



You are setting up a test site and wiring an update into it, then testing whether the updated system works.



The accounts and the subdomain already exist and every credential you need is in LastPass. You are not buying anything, not registering domains and not touching the live system.



The subdomain points at the same server the live system runs on. Everything you do stays inside the sandbox stack and the sandbox accounts. If a step ever seems to reach production, stop and ask.





WHAT YOU ARE GIVEN



From the LastPass folder shared with you. If an item is missing, ask rather than substituting your own, because several of these values have to match each other.



* Server address and the SSH private key, which is attached to its LastPass item
* The n8n sandbox address and its login
* The n8n encryption key, the database password and the Grafana admin password
* Five Google Sheets identifiers: the workbook and one for each of the URLs, Reports, Runs and Errors tabs
* Google OAuth client ID, client secret and the authorized redirect URI
* The storage account name and the upload preset name
* Grafana and Prometheus addresses and usernames
* The address of the scan page, which is published
* The AI provider key and endpoint, only if AI is being tested



You will have to create the Prometheus password hash \[docker compose run --rm caddy caddy hash-password --plaintext 'thepassword'] accordingly. 





STEP 1. CONNECT TO THE SERVER





Save the private key from LastPass to your machine, restrict its permissions and connect.

&#x20;   chmod 600 /path/to/the/key
ssh -i /path/to/the/key user@server-address



If the key is refused, report it rather than generating your own. The matching public key is already installed on the server and a new pair will not work.





STEP 2. BRING UP THE STACK





The stack is defined in docker-compose.yml and needs no edits.

&#x20;   make up
docker compose ps



Every container should be running. If one is unhealthy, read its log before going further.

&#x20;   docker compose logs --tail=200 grafana



Grafana refuses to start when the contact points file naming its email receiver is missing. That file is committed on purpose and holds no secret, because the address comes from ALERT\_EMAIL\_TO.



Prometheus sits behind a password on the reverse proxy. If the password hash is empty the proxy configuration is malformed and the service does not answer.





STEP 3. PUT THE SCRIPTS AND THE GUIDANCE LIBRARY ON THE SERVER





Three scan scripts from data/scripts/ go to /data/scripts/ inside the container, and data/remediation-library.json goes to /data/.

Copy all three scripts regardless of what is already there, so the versions match this repository.

&#x20;   make check-scripts



That confirms the scripts are present and that the modules they need resolve. If this fails, nothing after it will work, so stop here and resolve it.





STEP 4. FILL IN THE SETTINGS





Copy .env.sample to .env and fill it in from the LastPass items. CONFIGURATION.md is the full reference and marks which settings are required, which are optional and which belong to features that are switched off. 



Four decide whether anything works at all.



ALLOWED\_ORIGINS must contain the address of the scan page. If it is blank or wrong, the browser refuses the request before it is sent and the page reports that it could not reach the engine.



ALERT\_EMAIL\_TO must be the mailbox that should receive error alerts. If it is blank you will not see the alerts section D asks you to verify.



STORAGE\_API\_BASE and STORAGE\_PUBLIC\_BASE ship with working values in .env.sample. No provider is written into the workflows, so if either is blank the upload address evaluates to nothing and reports are silently not stored.



Generate the Prometheus password hash, choosing the password yourself and recording it with your findings.

&#x20;   docker compose run --rm caddy caddy hash-password --plaintext 'the-password-you-chose'



Put the resulting hash in PROMETHEUS\_PASS\_HASH. If it is blank the reverse proxy configuration is malformed and Prometheus does not answer, which blocks section G.



Also confirm NODE\_FUNCTION\_ALLOW\_BUILTIN=fs is set on both the n8n and worker services. Without it the guidance library falls back to an inline copy holding four criteria instead of 87, and reports look thin rather than broken.



Restart the stack after editing the settings.





STEP 5. GOOGLE CREDENTIAL IN N8N





Open n8n, add a Google Sheets credential and read the OAuth Redirect URL that n8n displays at the top of the credential form.



Compare it against the authorized redirect URI in LastPass. They must match exactly, including protocol and any port. If they differ, report it rather than editing the Google project.



The most common cause of a mismatch is n8n generating a URL that includes its internal port while the registered URI has none. Setting WEBHOOK\_URL to the public n8n address makes n8n generate the correct callback.



Enter the client ID and client secret from LastPass.



When you get to the point, contact us in trello and we will sign in to connect google account. 



&#x20;

STEP 6. IMPORT THE WORKFLOWS





Import the five files from data/workflows/ through the n8n interface and publish each one. This takes seconds. Keep one file per workflow, because two files sharing an identifier overwrite each other.



Then open each workflow and confirm every credential points at a sandbox destination. An imported workflow carries a reference to a credential, not the credential itself.





STEP 7, RUN TC-00



The scan page is not yours to build or deploy. It is published for you and its address is in the list above. Open it and check it loads.



Then run TC-00 from TEST\_PLAN.md before any other case. It submits one address and confirms the scan engine runs at all in this environment. It takes about two minutes.



If the page reports that it could not reach the engine, its address and ALLOWED\_ORIGINS do not agree. Report that rather than editing either one.



Until TC-00 passes, every other result is unreliable, because this scan engine has never run here before.



Once it passes, work through the rest of the test plan in order.

