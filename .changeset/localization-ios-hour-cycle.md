---
'expo-localization': patch
---

[iOS] Fix `uses24hourClock` reporting a 24-hour clock for locales whose 12-hour time pattern marks the period with `B` instead of `a`, such as `zh-Hant-TW` and `hi-IN`.
