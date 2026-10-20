---
'@expo/fingerprint': patch
---

Include the ES modules that an ES module config or config plugin imports in the fingerprint on Node.js 22.15 and later. Older Node versions still omit them. Fingerprints change once on upgrade for projects that have such imports.
