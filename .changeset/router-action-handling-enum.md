---
'expo-router': patch
---

Add `RouterActionHandling` so `getStateForAction` can delegate an action to the base router or leave it unhandled, and `isActionHandled` to check a result. Built-in and extended routers now return `RouterActionHandling.Unhandled` instead of `null` for an unhandled action.
