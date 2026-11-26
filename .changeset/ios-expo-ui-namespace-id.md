---
'@expo/ui': patch
---

[iOS] Fix `Namespace`, whose `id` didn't reach the native view, so `matchedGeometryEffect` and `glassEffectId` found no namespace.
