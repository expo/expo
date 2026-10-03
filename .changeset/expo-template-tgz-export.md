---
'expo': patch
---

Add `./template.tgz` to the `exports` map so `expo/template.tgz` resolves again. Before, the `./*` wildcard mapped it to the nonexistent `template.tgz.js`, so `expo prebuild` couldn't use the template bundled with `expo` and fell back to downloading one from npm.
