---
'expo-router': patch
---

Fix a deep link to a screen inside an existing navigator, such as a tab, stacking a second copy of that navigator on top of a presented modal or sheet instead of returning to it. Inside nested stacks a deep link again returns to a screen that is already there, as it did before SDK 58.
