---
'expo-router': patch
---

Replace a blocked stack screen with its `redirectTo` route and remove other blocked screens as soon as the guard changes, before navigation started in the same handler. Breaking: the stack `createProps` factories no longer return `removeRoutes`.
