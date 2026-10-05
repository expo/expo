---
'@expo/config-plugins': patch
---

Warn when a package's `app.plugin.js` is missing from its `package.json:exports`, since tools that resolve the config plugin through Node can't find it.
