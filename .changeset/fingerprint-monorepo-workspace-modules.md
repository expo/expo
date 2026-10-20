---
'@expo/fingerprint': patch
---

Include config plugins from a linked workspace package, and the modules they import, in the fingerprint on Node.js 22.15 and later. Older Node versions still leave them out. Fingerprints change once on upgrade for projects that use such plugins.
