---
'expo-router': patch
---

Place JavaScript headers below the top edge on iPhone Duo, where the status bar sits in the vertical bar, and add space below the title row on iPhone, to line up with native navigation bars. Override the header's top offset with the `safeAreaInsets` prop on `Stack` and `Tabs` from `expo-router/js-stack` and `expo-router/js-tabs`.
