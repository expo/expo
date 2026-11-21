---
'expo-updates': patch
---

Drop the previous native state change listener before registering a new one, so re-evaluating `UpdatesEmitter` no longer stacks a subscription that retains the whole module scope — a leak that grew per request under server rendering until the dev server crashed with OOM.
