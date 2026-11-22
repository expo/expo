---
'expo-widgets': major
---

[iOS] A dynamic enum parameter now uses an `AppEntity`, so the widget edit screen shows the name of the default option, not its value. This resets the option that people picked in widgets that are already on the Home Screen: after the app update, the parameter has no value until the person picks an option again, and `environment.configuration` receives `null` for it until then.
