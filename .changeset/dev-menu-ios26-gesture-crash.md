---
'expo-dev-menu': patch
---

[iOS] Fix a crash on iOS 26 when you touch the app while the dev menu opens or closes. The three-finger long press now moves to the key window when that window changes, instead of moving each time UIKit reads a window's gesture recognizers.
