---
'@expo/config-plugins': patch
---

Fix `gradle.properties` lines that use `:` or whitespace to separate the key from the value, such as `key:value` or `key = value`, and lines that start with `!`.
