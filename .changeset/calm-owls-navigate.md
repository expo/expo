---
'expo-router': patch
---

Fix `router.navigate()` staying inside the open layout when it moves to another route of a layout whose name has a dynamic segment among several segments, such as `[org]/[project]` or `user/[id]`.
