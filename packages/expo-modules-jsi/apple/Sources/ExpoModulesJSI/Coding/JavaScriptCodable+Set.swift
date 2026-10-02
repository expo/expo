// Copyright 2026-present 650 Industries. All rights reserved.

// `Set` encodes to a JS `Set` and decodes from a JS `Set` or, like `Array`, from an array or an arrayized
// scalar. JSI has no `Set` API, so the conversions go through the runtime's global `Set` and `Array`
// constructors. Equality differs between the two sides: a JS `Set` compares objects by reference while
// a Swift `Set` compares by `Hashable`, so two distinct JS objects that decode to equal values collapse
// into a single element.

extension Set: JavaScriptDecodable where Element: JavaScriptDecodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Set<Element>
  {
    // The cheap tag checks come first: an array takes the `Array` path directly, and a primitive
    // can't be a JS `Set`, so both skip the JS call below. Any other value that is not a JS `Set` is
    // arrayized, as in `Array`. Duplicates in an array collapse without an error.
    guard !value.isArray(), value.isObject(), let entries = try runtime.setEntries(of: value) else {
      return Set(try [Element].decode(value, in: runtime))
    }
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
    return try runtime.setConstructor().callAsConstructor(entries)
  }
}

extension JavaScriptRuntime {
  /// Copies the entries of a JS `Set` out into a JS array, or returns `nil` when the value is not a
  /// JS `Set`. The instance check and the copy run in a single call to a cached JS function, which
  /// saves the global lookups and the separate `instanceof` call of `value.is("Set")` followed by
  /// `Array.from`. For a small `Set` those fixed costs are most of the decode time.
  @usableFromInline
  @JavaScriptActor
  func setEntries(of value: borrowing JavaScriptValue) throws -> JavaScriptValue? {
    let function = try cached(setEntriesFunctionKey) {
      return try eval(
        label: "expo-modules-jsi/set-entries.js",
        "(function (value) { return value instanceof Set ? Array.from(value) : undefined; })"
      )
    }
    let entries = try function.getFunction().call(arguments: value.copy())
    return entries.isUndefined() ? nil : entries
  }

  /// Returns the global `Set` constructor, looked up once and cached, so an encode doesn't pay for
  /// the global property lookup.
  @usableFromInline
  @JavaScriptActor
  func setConstructor() throws -> JavaScriptFunction {
    let constructor = try cached(setConstructorKey) {
      return try global().getPropertyAsFunction("Set").asValue()
    }
    return constructor.getFunction()
  }
}

/// Keys of the `Set` entries function and the `Set` constructor in each runtime's cache.
private let setEntriesFunctionKey = JavaScriptRuntime.Cache.Key<JavaScriptValue>()
private let setConstructorKey = JavaScriptRuntime.Cache.Key<JavaScriptValue>()
