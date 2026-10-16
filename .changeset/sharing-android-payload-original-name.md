---
'expo-sharing': minor
---

[Android] Add `getSharedPayloadsAsync` to read raw share payloads with file display names without copying attachments. Metadata is read off the JavaScript thread; the synchronous `getSharedPayloads` method is unchanged.
