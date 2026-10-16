---
'expo-sharing': patch
---

On Android, add `originalName` to the payloads that `getSharedPayloads` returns. It contains the display name of a shared file, so you can show the file name without resolving the payload.
