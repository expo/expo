---
'expo-widgets': patch
---

[iOS] Show an empty widget, instead of an error, before the app has been launched. The widget layout is stored when the app first runs `createWidget()`, so a freshly installed or updated app that hasn't been opened yet has no layout. Widgets in this state, including previews in the widget gallery, rendered the "No layout found" red box. Because that view has no container background, iOS 17+ replaced it with the system's "Please adopt containerBackground API" placeholder. They now render an empty view with the system's tertiary fill until the app runs.
