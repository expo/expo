---
'expo-router': patch
---

Align headers in `expo-router/js-stack` and `expo-router/js-tabs` with native navigation bars on iPhone Duo. Use the `safeAreaInsets` prop to override the header's top offset. In `expo-router/js-tabs`, an existing `safeAreaInsets.top` now applies to headers as well as the tab bar.
