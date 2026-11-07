---
'@expo/config': patch
---

Return a warning from `modifyConfigAsync` and restore the static config, instead of throwing a `TypeError`, when a function-like dynamic config does not return the modified top-level key (such as `ios`).
