---
'expo-router': patch
---

Export the `RouterBrowserHistoryAction` type. The public `Router` and `RouterActionResult` types reference it, so custom routers can now type the browser history instruction they return.
