---
"expo-modules-jsi": patch
---

[iOS] Read host object property names through `getPropNameIdData` instead of building a `std::string` for every access, making property access from JavaScript up to 14% faster for long names.
