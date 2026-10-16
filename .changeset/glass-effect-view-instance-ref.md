---
'expo-glass-effect': patch
---

Type the `ref` prop of `GlassView` and `GlassContainer` as the `View` instance type. With the strict React Native types, a ref from `useRef<ComponentRef<typeof View>>()` now type-checks.
