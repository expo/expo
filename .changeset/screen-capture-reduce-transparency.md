---
'expo-screen-capture': patch
---

[iOS] Fix the app switcher blur from `enableAppSwitcherProtectionAsync` leaving the app content readable when "Reduce Transparency" is enabled. The blur now uses a blurred snapshot of the window in that case.
