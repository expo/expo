---
'expo-document-picker': patch
---

[iOS] Fix `getDocumentAsync` rejecting every later call with `PickingInProgressException` after a picker was dismissed together with its presenting view controller. The orphaned call now resolves as canceled when the next call starts.
