---
'@expo/metro-config': patch
'babel-preset-expo': patch
---

Drop Hermes v1 transform workaround plugins. Three transforms existed to work around Hermes v1 issues, which have since been resolved in Hermes 260318099.0.x
