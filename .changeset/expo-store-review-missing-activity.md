---
'expo-store-review': patch
---

[Android] Fix `requestReview` crashing the app with `MissingActivity` when the activity is destroyed before the review flow is ready. The promise now rejects instead.
