---
'@expo/config-plugins': patch
---

Skip object, array and `null` values in `locales` JSON files instead of writing them into `InfoPlist.strings` and `strings.xml` as text such as `[object Object]`, and warn with the offending keys.
