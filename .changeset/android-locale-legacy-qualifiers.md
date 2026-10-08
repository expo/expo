---
'@expo/config-plugins': patch
'expo-localization': patch
---

Fix Android resource qualifiers for Hebrew, Indonesian and Yiddish locales, which Android only resolves under their legacy codes (`iw`, `in`, `ji`), and keep the `zh-rCN`, `zh-rTW` and `zh-rHK` library translations when `supportedLocales` lists `zh-Hans` or `zh-Hant`.
