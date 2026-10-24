---
'expo-widgets': patch
---

Expose the device locale to widget JS runtimes. A `__expoWidgetDeviceLocale` global holds the device's primary language code, set by Android at each widget render and by iOS when the JS context is created, so layouts can localize faces that render before the app has ever run. Layouts that read nothing behave exactly as before.
