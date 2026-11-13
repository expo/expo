// Copyright 2026-present 650 Industries. All rights reserved.

/**
 The name `String(describing: type)` gives for a metatype, without its three protocol conformance probes and the `Mirror`.
 It takes an opaque `Any.Type` and is never inlined on purpose.
 With a statically known metatype the optimizer folds `_typeName` into a constant that keeps the file discriminator
 of a `private` type, e.g. `(Foo in _ABC123…)`, where `String(describing:)` yields `Foo`.
 */
@inline(never)
internal func unqualifiedTypeName(_ type: Any.Type) -> String {
  return _typeName(type, qualified: false)
}
