---
'@expo/fingerprint': patch
---

Include the modules that an app config requires from outside the project, such as a config plugin from a linked workspace package, in the fingerprint, except those in `node_modules`. Fingerprints change once on upgrade for projects that require such modules.
