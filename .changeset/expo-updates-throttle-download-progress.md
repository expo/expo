---
"expo-updates": patch
---

Report download progress to JS in steps of at least 1% instead of for every asset and every read of a download. Each progress event sends the whole state machine context, manifest included, so updates with many assets were slow to download.
