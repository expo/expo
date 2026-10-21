---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.22.0. `@Record` types now read and write their JavaScript properties with less overhead. The new `@JS` option `.withAsync("name")` also binds a synchronous function under that name, as a function that returns a promise and runs on the concurrent thread pool. A `@Record` can now be a `final class`, and a class that isn't `final` or has an inheritance clause gets a build error that says how to fix it. A `@JS init` now reports an argument type that can't be converted from JavaScript at the initializer.
