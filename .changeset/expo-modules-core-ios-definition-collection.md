---
"expo-modules-core": patch
---

[iOS] Speed up module registration at app launch. `ObjectDefinition`, `ModuleDefinition`, `ViewDefinition` and `ClassDefinition` sorted their DSL elements with 7–9 passes of `compactMap { $0 as? SomeProtocol }`; every `Function`, `Property` and `View` closure is a distinct generic type, so each pass ran a full `swift_conformsToProtocol` scan of every loaded image's conformance records. Each element now appends itself to a statically typed bucket in a single pass, the default type-name fallbacks use `_typeName(_:qualified: false)` instead of `String(describing:)` (same output, no reflection), and the `~ReturnType.self` dynamic-type classification is memoized per type. Same definitions, same JS API; in a release build with 37 modules, including `@expo/ui`, building the definitions dropped from ~1.7 s to ~0.2 s.
