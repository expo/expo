---
'@expo/config-plugins': patch
---

Fix `gradle.properties` lines that have no `=` or that continue a value with a trailing backslash. Prebuild no longer rewrites these lines into invalid properties, such as a broken `org.gradle.jvmargs`.
