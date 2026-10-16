---
'expo-router': patch
---

Fix a deep link to a screen inside an existing navigator, such as a tab, stacking a second copy of that navigator on top of a presented modal or sheet instead of returning to it.
