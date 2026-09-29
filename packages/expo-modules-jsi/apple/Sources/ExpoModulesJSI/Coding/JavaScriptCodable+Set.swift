// Copyright 2026-present 650 Industries. All rights reserved.

// `Set` encodes to a JS `Set` and decodes from a JS `Set` or, like `Array`, from an array or an arrayized
// scalar. JSI has no `Set` API, so the conversions go through the runtime's global `Set` and `Array`
// constructors, the same way `Date` goes through the global `Date`. Equality differs between the two
// sides: a JS `Set` compares objects by reference while a Swift `Set` compares by `Hashable`, so two
// distinct JS objects that decode to equal values collapse into a single element.

extension Set: JavaScriptDecodable where Element: JavaScriptDecodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Set<Element>
  {
    // The cheap array tag check comes before `is("Set")`, which does a global lookup plus an
    // `instanceof` walk. Any other value that is not a JS `Set` is arrayized, as in `Array`.
    // Duplicates in an array collapse without an error.
    guard !value.isArray(), value.is("Set") else {
      return Set(try [Element].decode(value, in: runtime))
    }
    // `Array.from` copies the entries out in a single call, rather than one iterator call per entry.
    let entries = try runtime.global().getPropertyAsObject("Array").callFunction("from", arguments: value.copy())
    return Set(try [Element].decode(entries, in: runtime))
  }
}

extension Set: JavaScriptEncodable where Element: JavaScriptEncodable {
  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Set<Element>, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    // Constructing from an array fills the set in a single call, rather than one `add` call per element.
    let entries = try [Element].encode(Array(value), in: runtime)
    let setConstructor = try runtime.global().getPropertyAsFunction("Set")
    return try setConstructor.callAsConstructor(entries)
  }
}
