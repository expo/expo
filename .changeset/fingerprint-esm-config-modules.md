---
'@expo/fingerprint': patch
---

Include the ES modules that an ES module config or config plugin imports in the fingerprint on Node.js 22.15 and later. Older Node versions still omit them, so the fingerprint of such a project differs between Node versions. On Node.js 22.15 and later, it changes once on upgrade.
