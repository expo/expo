---
'expo-modules-core': minor
---

[iOS] Add `BaseEventEmitter`, the base class of the `@JSClass` classes that emit events. The JavaScript class of a subclass extends `expo.EventEmitter`. A `@JSClass` root class can set its `NativeState` type and implement `makeNativeState(for:object:in:)` to keep more state with its JavaScript object.
