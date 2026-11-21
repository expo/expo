---
'expo-router': patch
---

Keep route descriptors, their options, and `describe` stable between renders, so a navigation no longer re-renders the navigators it does not change.
