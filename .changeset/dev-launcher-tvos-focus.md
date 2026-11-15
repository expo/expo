---
'expo-dev-launcher': patch
---

[tvOS] Fix development builds where no view can take focus. The wrapper view around the React root view now forwards UIKit's preferred-focus search to it, so `hasTVPreferredFocus` and `focus()` work and the remote moves focus.
