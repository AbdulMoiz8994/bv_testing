WORKFLOW EXPORTS





These files must always match the published versions running in n8n.



EXPORTING



&#x20;   docker compose exec n8n n8n export:workflow --all --published \\
      --output=/data/workflows --separate --pretty





\--published is required. Without it you get the draft, what someone was last editing, not what production runs. On the previous version of this project that difference was ten months and an entire feature.





RULES



* One file per workflow ID. Two files sharing an ID will overwrite each other unpredictably on import.
* Do not hand-edit these files. Edit in the n8n UI, then re-export. Hand-editing has previously produced workflows referencing steps that do not exist.
* Re-export after every workflow change. This is part of the definition of done.





IMPORTING



&#x20;   docker compose exec n8n n8n import:workflow \\
      --input=/data/workflows --separate --overwrite





After importing, update every credential inside n8n to the sandbox value. Imported workflows carry credential *references*, not the credentials themselves.





EXPECTED FILES



* MFabwG2vZwybIV5C.json, workflow workflow a, trigger: Webhook.
* fnGm5H64kdzzC7M1.json, workflow workflow b, trigger: Schedule.
* HrlKECidXb47thNW.json, workflow workflow c, trigger: Called by A and B.
* 0NYAAQrl0oyyecyl.json, workflow error trigger global, trigger n8n error trigger.
* JEIdCUjXGGR5sBi6.json, workflow error notifier reusable, trigger: Called by C.





STATUS



Populated from the live instance.



If exporting from the n8n interface rather than the command line, be aware that the Download option exports the draft. Use the command above or confirm the workflow shows no unpublished changes before downloading.

