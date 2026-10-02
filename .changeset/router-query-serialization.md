---
"expo-router": patch
---

Generated route query strings now encode spaces as `+`, leave `*` unescaped, encode `~` as `%7E`, and write raw null values as `key=`.
