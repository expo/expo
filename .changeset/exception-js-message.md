---
'expo-modules-core': patch
---

[iOS] Fixed JavaScript errors created from native `Exception`s using the exception's debug description as their `message`, which prefixed it with the Swift type name and appended the native `file:line` (e.g. `MyException: reason (at MyModule.swift:42)`). The message is the exception's `description` again, as before the JSI rewrite and as on Android. `Exception.message` can now be overridden by subclasses; subclasses that already declare a `message` property need to mark it as `override`.
