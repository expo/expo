---
"expo-symbols": patch
---

Honor `aria-hidden` and `aria-label` on `SymbolView`. On iOS they are now mapped to `accessibilityElementsHidden` and `accessibilityLabel`. On Android and web, view props such as `aria-hidden`, accessibility props and `testID` are now forwarded to the rendered view instead of being dropped.
