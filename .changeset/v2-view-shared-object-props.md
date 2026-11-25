---
'expo-modules-core': patch
---

[iOS] Fix shared object props of Expo Modules API 2.0 views. JS sent the ID of the shared object, which the props decoder of the view can't decode, so the prop kept its old value. JS now sends the shared object.
