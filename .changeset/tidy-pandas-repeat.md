---
"@expo/config-plugins": patch
---

Allow `propertiesListToString` and `withGradleProperties` to accept a readonly `PropertiesItem[]`, so config plugins that build the gradle properties list immutably type-check without copying it into a mutable array.
