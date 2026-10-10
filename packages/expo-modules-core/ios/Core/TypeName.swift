/**
 The unqualified name of a type, as `String(describing: type)` returns it for a metatype.

 `String(describing:)` on a metatype probes `TextOutputStreamable`, `CustomStringConvertible` and
 `CustomDebugStringConvertible` (three protocol conformance scans), builds a `Mirror` and then returns
 `_typeName(type, qualified: false)`. This calls `_typeName` directly, which matters at startup where
 the fallback names of hundreds of definitions are computed on first-time generic types.

 It is deliberately not inlinable and takes an opaque `Any.Type`: given a statically known metatype,
 the optimizer folds `_typeName` to a constant, and that constant keeps the file discriminator of a
 `private`/`fileprivate` type (`(Foo in _ABC123…)`) where the runtime path, like `String(describing:)`,
 yields `Foo`.
 */
@inline(never)
public func _unqualifiedTypeName(_ type: Any.Type) -> String {
  return _typeName(type, qualified: false)
}
