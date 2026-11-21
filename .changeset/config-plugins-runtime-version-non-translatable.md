---
'@expo/config-plugins': patch
---

[Android] Mark the `expo_runtime_version` string resource as `translatable="false"`, so localization tooling and Android Lint treat it as the technical identifier it is rather than user-facing copy.
