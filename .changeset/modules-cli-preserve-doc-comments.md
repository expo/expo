---
'expo-modules-cli': patch
---

`generate-types` now keeps the doc comments written in the generated file. Each comment stays above the declaration or member with the same TypeScript name. The command warns when it drops a comment because its declaration is gone, and prints the text of that comment. It also warns when a declaration with a comment changed.
