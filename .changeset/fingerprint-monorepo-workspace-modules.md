---
'@expo/fingerprint': patch
---

Include the CommonJS modules that an app config loads from a linked workspace package, such as a config plugin, in the fingerprint on Node.js 22.15 and later. Older Node versions still omit them, so the fingerprint of such a project differs between Node versions. On Node.js 22.15 and later, it changes once on upgrade.
