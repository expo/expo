---
'expo-router': patch
---

Add `RouterActionHandling` so `getStateForAction` can delegate an action to the base router or reject it, and `isActionRejected` to check a result. Built-in and extended routers now return `RouterActionHandling.Reject` instead of `null` for a rejected action.
