---
'expo-router': patch
---

Export the `ExtendedRouter` and `RouterExtensionMembers` types. The public `extendRouter`, `extendRouterActions`, and `RouterExtension` APIs reference them, so custom routers can now type the routers and extension members they create.
