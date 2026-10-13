---
'expo-router': patch
---

Add `RouterActionHandling` to delegate or reject an action from an `extendRouter` extension's `getStateForAction` or an `extendRouterActions` reducer. Returning `null` or `undefined` for this is deprecated.
