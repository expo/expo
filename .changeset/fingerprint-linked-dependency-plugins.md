---
'@expo/fingerprint': patch
---

Keep the modules that an app config requires from a linked dependency, such as a config plugin from a workspace package in a monorepo, in the fingerprint. Fingerprints change once on upgrade for projects that require such modules.
