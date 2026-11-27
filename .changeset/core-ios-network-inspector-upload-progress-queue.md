---
'expo-modules-core': patch
---

[iOS] Fix a crash in development builds with the network inspector on: upload progress is now sent on the original session's delegate queue. Delegates that check their queue, such as Alamofire, crashed on the first request with a body.
