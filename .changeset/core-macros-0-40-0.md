---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.40.0 and add the `.cached` option of `@JS`. On the first read, the getter of a `.cached` computed property runs, and its value is stored as a read-only data property on the JavaScript object. So each runtime runs the getter once, and each instance of a shared object stores its own value. Use it instead of a `lazy var` for a property that more than one runtime can read. Add `@ViewProps(extending:)`, which gives a props struct the props and events of another `@ViewProps` struct. The struct holds them in a `base` property, such as `props.base.title`, and a diff names them with `.base(_:)`, such as `diff.changed(.base(.title))`.
