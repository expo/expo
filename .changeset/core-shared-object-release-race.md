---
'expo-modules-core': patch
---

[iOS] Fix shared objects that native code returns to JavaScript again after their earlier JavaScript object was garbage-collected. Their members could throw "Unable to find the native shared object associated with given JavaScript object", or the returned object could belong to another shared object.
