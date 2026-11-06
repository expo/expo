---
'expo-sharing': patch
---

Store files shared into the app in a unique directory for each file, with a safe file name. Files with the same name no longer replace each other. `clearSharedPayloads()` now deletes these files, and files older than 24 hours are deleted when new shared files are processed. On iOS, the files are now in the app group's `Library/Caches/expo-sharing` directory. `useIncomingShare()` now also clears its returned payloads when you call `clearSharedPayloads()`.
