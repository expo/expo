---
'@expo/ui': patch
'expo-widgets': patch
---

[Android] Add an `openApp` option to the widget `Button`. A button with `openApp` launches the app when tapped, instead of sending a widget interaction that reloads the widget. The option defaults to `false`, so existing buttons behave exactly as before.
