---
'expo-widgets': patch
---

[iOS] Fix widget layout errors being hidden behind the system's "Please adopt containerBackground API" placeholder on iOS 17+. The red box shown when a widget's layout fails to evaluate now declares a container background, so its error message is visible.
