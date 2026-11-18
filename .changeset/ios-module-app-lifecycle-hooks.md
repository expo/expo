---
'expo-modules-core': patch
'expo-keep-awake': patch
'expo-screen-capture': patch
---

[iOS] Add the `appWillEnterForeground`, `appDidBecomeActive`, and `appDidEnterBackground` lifecycle hooks to modules. They are equivalents of the `OnAppEntersForeground`, `OnAppBecomesActive`, and `OnAppEntersBackground` DSL components, run on the main actor, and work in `@ExpoModule` modules.

If your module already has a method with one of these names, check it:

- In a `Module` subclass, the method no longer compiles. Rename it, or add `override` and remove the `NotificationCenter` observer that calls it.
- In an `@ExpoModule` class that doesn't inherit `Module`, a non-private method with one of these names becomes the hook. If your module also calls it from its own `NotificationCenter` observer, it runs twice. Rename it, or remove that observer.
