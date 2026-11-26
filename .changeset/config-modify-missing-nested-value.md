---
'@expo/config': patch
---

Fix `modifyConfigAsync` throwing and leaving the static config modified when a function-like dynamic config drops a nested object from the modifications.
