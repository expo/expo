---
'expo-router': patch
---

[Internal] Vendor the `@radix-ui/react-slot` dependency.

`asChild` on `Link` and `TabTrigger` no longer supports a Radix `Slottable` child. Before, when your app and `expo-router` resolved the same `@radix-ui/react-slot` instance, the props and the ref went to the child of `Slottable`. Now they go to `Slottable` itself. Pass the target element as the direct child instead.
