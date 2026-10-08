---
'expo': patch
---

Stop `expo/types` redeclaring web style members that React Native 0.88 declares itself. The duplicate declarations made `ViewStyle` unassignable to `View`, and `ViewProps` unassignable to `Pressable`.

`backgroundImage`, `backgroundPosition`, `backgroundRepeat`, `backgroundSize`, `boxShadow`, `boxSizing`, `filter` and `outlineColor` now come from React Native, which types them more precisely than the plain `string` this package declared — the CSS string form still works, and the structured array forms are newly accepted. The web-only `position: 'fixed' | 'sticky'` and `cursor` values are still declared here.
