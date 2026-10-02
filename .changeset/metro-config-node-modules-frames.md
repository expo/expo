---
'@expo/metro-config': patch
---

Stop collapsing every `node_modules` stack frame, so errors thrown inside a library point to where they were thrown.
