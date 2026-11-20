---
'expo-location': patch
---

[Android] Fix `ConcurrentModificationException` in the motion activity broadcast receiver when `getMotionActivityAsync` or `watchMotionActivityAsync` subscriptions are added or removed while an activity update is delivered. Removing a motion activity subscription a second time no longer rejects with `Not authorized to use location services`.
