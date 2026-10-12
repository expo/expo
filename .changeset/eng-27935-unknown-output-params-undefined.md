---
"expo-router": patch
"@expo/cli": patch
---

Allow interfaces extending `UnknownOutputParams` to declare optional params, so an omitted query parameter can be typed as optional, e.g. `interface MyParams extends UnknownOutputParams { id?: string }`.
