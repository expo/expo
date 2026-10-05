---
'expo-module-scripts': patch
---

`depscheck` fails when a package ships an `app.plugin.js` that its `package.json:exports` doesn't list.
