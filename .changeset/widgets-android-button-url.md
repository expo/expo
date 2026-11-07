---
'expo-widgets': patch
'@expo/ui': patch
---

[Android] Add a `url` prop to buttons in widgets and custom notifications. Pressing the button opens the URL, for example a deep link into the app. Until now a widget button could only call `onClick`, which runs in the background and cannot open the app on Android 10+.
