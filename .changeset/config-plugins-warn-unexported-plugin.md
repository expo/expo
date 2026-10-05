---
'@expo/config-plugins': patch
---

Warn when a package's `app.plugin.js` is missing from its `package.json:exports`, since tools that resolve config plugins through Node's package exports, such as EAS CLI, can't find it.
