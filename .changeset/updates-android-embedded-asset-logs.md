---
'expo-updates': patch
---

[Android] Stop logging each embedded asset at launch. This shortens launch for apps with many bundled assets and stops the updates log file from growing by one entry per asset on each launch.
