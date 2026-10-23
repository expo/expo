---
'expo-modules-jsi': patch
---

[iOS] Make `JavaScriptObject.takeValue()` and `JavaScriptArray.takeValue()` public. They move an object or an array into a `JavaScriptValue` without the copy that `asValue()` makes.
