// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
internal import jsi

/// A Swift representation of a JavaScript object. Provides access to JavaScript object properties and methods,
/// supporting property access, modification, enumeration, prototype manipulation, and function calling.
public struct JavaScriptObject: JavaScriptType, Sendable, ~Copyable {
  /// Handle to the runtime the object belongs to.
  internal let runtimeHandle: JavaScriptRuntimeHandle
  internal var pointee: facebook.jsi.Object

  /// The runtime the object belongs to, or `nil` if it has been deallocated. Prefer ``jsiRuntime`` on
  /// hot paths: it costs no reference counting.
  internal var runtime: JavaScriptRuntime? {
    return runtimeHandle.runtime
  }

  /// The engine runtime the object belongs to, or `nil` if the runtime has been deallocated.
  internal var jsiRuntime: facebook.jsi.IRuntime? {
    return runtimeHandle.pointee
  }

  /// Whether the object belongs to the given runtime, the runtime that created it. Use it only with the runtime it
  /// belongs to, on the thread of that runtime.
  public func belongs(to runtime: borrowing JavaScriptRuntime) -> Bool {
    return runtimeHandle === runtime.handle
  }

  /// Creates a new object in the given runtime.
  public init(_ runtime: borrowing JavaScriptRuntime) {
    self.init(runtime, facebook.jsi.Object(runtime.pointee))
  }

  /// Creates a new object from the dictionary whose values are representable in JS.
  public init<DictValue: JavaScriptRepresentable>(
    _ runtime: borrowing JavaScriptRuntime,
    _ dictionary: [String: DictValue]
  ) {
    self.runtimeHandle = runtime.handle
    self.pointee = dictionary.toJavaScriptValue(in: runtime).getObject().pointee
  }

  /// Creates a new object from existing JSI object.
  internal init(_ runtime: borrowing JavaScriptRuntime, _ object: consuming facebook.jsi.Object) {
    self.runtimeHandle = runtime.handle
    self.pointee = object
  }

  /// Creates a new object from existing JSI object, which belongs to the runtime behind `runtimeHandle`.
  internal init(_ runtimeHandle: JavaScriptRuntimeHandle, _ object: consuming facebook.jsi.Object) {
    self.runtimeHandle = runtimeHandle
    self.pointee = object
  }

  /// Result of `object instanceof constructor`, which tests if the prototype property of a constructor appears anywhere in the prototype chain of an object.
  public func instanceOf(_ constructor: borrowing JavaScriptFunction) -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return pointee.instanceOf(jsiRuntime, constructor.pointee)
  }

  /// Result of `object instanceof constructor`, which tests if the prototype property of a constructor appears anywhere in the prototype chain of an object.
  public func instanceOf(_ constructor: borrowing JavaScriptValue) -> Bool {
    return instanceOf(constructor.getFunction())
  }

  /// Equivalent to `Array.isArray()` in JS. If it returns `true`, then `getArray()` will succeed.
  public func isArray() -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return pointee.isArray(jsiRuntime)
  }

  /// Returns `true` if the object is callable. If so, then `getFunction()` will succeed.
  public func isFunction() -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return pointee.isFunction(jsiRuntime)
  }

  /// Returns `true` if the object is backed by a `jsi::HostObject`, including host objects
  /// created via `JavaScriptRuntime.createHostObject` and ones produced by other native code.
  public func isHostObject() -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return expo.isHostObject(jsiRuntime, pointee)
  }

  public func isArrayBuffer() -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return pointee.isArrayBuffer(jsiRuntime)
  }

  /// Returns `true` if the object is a typed array, such as `Uint8Array`.
  internal func isTypedArray() -> Bool {
    if expo.hasNativeTypedArraySupport() {
      guard let jsiRuntime else {
        FatalError.runtimeLost()
      }
      return expo.isTypedArray(jsiRuntime, pointee)
    }
    guard let runtime = runtimeHandle.unretainedRuntime else {
      FatalError.runtimeLost()
    }
    return runtime._withUnsafeGuaranteedRef { runtime in
      JavaScriptTypedArray.isTypedArrayFallback(pointee, in: runtime)
    }
  }

  /// Returns the object as an array buffer, or asserts if not an array buffer.
  public func getArrayBuffer() -> JavaScriptArrayBuffer {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    assert(isArrayBuffer(), "Object is not an ArrayBuffer")
    return JavaScriptArrayBuffer(runtimeHandle, pointee.getArrayBuffer(jsiRuntime))
  }

  /// Returns the object as an array, or asserts if not an array.
  public func getArray() -> JavaScriptArray {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    assert(isArray(), "Object is not an array")
    return JavaScriptArray(runtimeHandle, pointee.getArray(jsiRuntime))
  }

  /// Returns the object as a function, or asserts if not a function.
  public func getFunction() -> JavaScriptFunction {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    assert(isFunction(), "Object is not a function")
    return JavaScriptFunction(runtimeHandle, pointee.getFunction(jsiRuntime))
  }

  // MARK: - Accessing object properties

  /// Checks whether the object has a property with the given name.
  public func hasProperty(_ name: String) -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return pointee.hasProperty(jsiRuntime, name.toJSIPropNameID(in: jsiRuntime))
  }

  /// Returns the property of the object with the given name,
  /// or `undefined` value if the name is not a property of the object.
  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, pointee.getProperty(jsiRuntime, name.toJSIPropNameID(in: jsiRuntime)))
  }

  /// Calls `body` with the property of the object with the given name, or `undefined` if there is no
  /// such property, lent as a `JavaScriptUnownedValue` instead of wrapped in a new `JavaScriptValue`.
  /// The value is valid only for the duration of the closure and must not be stored or escaped.
  public func withUnownedProperty<R>(_ name: String, _ body: (borrowing JavaScriptUnownedValue) throws -> R) rethrows
    -> R
  {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let property = pointee.getProperty(jsiRuntime, name.toJSIPropNameID(in: jsiRuntime))
    return try withUnowned(property, in: jsiRuntime, body)
  }

  /// Calls `body` with the property of the object with the given prop name id, or `undefined` if there
  /// is no such property, lent as a `JavaScriptUnownedValue` instead of wrapped in a new `JavaScriptValue`.
  /// The value is valid only for the duration of the closure and must not be stored or escaped.
  public func withUnownedProperty<R>(
    _ propName: JavaScriptPropNameID,
    _ body: (borrowing JavaScriptUnownedValue) throws -> R
  ) rethrows -> R {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let property = pointee.getProperty(jsiRuntime, propName.pointee)
    return try withUnowned(property, in: jsiRuntime, body)
  }

  private func withUnowned<R>(
    _ property: borrowing facebook.jsi.Value,
    in jsiRuntime: facebook.jsi.IRuntime,
    _ body: (borrowing JavaScriptUnownedValue) throws -> R
  ) rethrows -> R {
    // `withUnsafeBytes(of:)` rather than `withUnsafePointer(to:)`; see `JavaScriptValue.withUnsafePointee(_:)`.
    return try withUnsafeBytes(of: property) { bytes in
      guard let baseAddress = bytes.baseAddress else {
        preconditionFailure(
          "withUnsafeBytes(of:) gave an empty buffer for a jsi::Value, which can't happen for a non-zero-sized type"
        )
      }
      let pointer = baseAddress.assumingMemoryBound(to: facebook.jsi.Value.self)
      return try body(JavaScriptUnownedValue(jsiRuntime, pointer))
    }
  }

  /// Returns the property of the object with the given prop name id,
  /// or `undefined` value if the name is not a property of the object.
  public func getProperty(_ propName: JavaScriptPropNameID) -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, pointee.getProperty(jsiRuntime, propName.pointee))
  }

  /// Accesses nested properties in a single subscript operation by traversing the object chain.
  /// This subscript provides a convenient way to access deeply nested properties without
  /// multiple chained calls to `getProperty()`. Each key in the chain is accessed sequentially,
  /// treating intermediate values as objects.
  ///
  /// - Parameters:
  ///   - key: The first property name to access on this object
  ///   - nestedKeys: Variadic list of subsequent property names to access on nested objects
  /// - Returns: The `JavaScriptValue` at the end of the property chain
  /// - Note: Each intermediate value in the chain (except the last) must be an object.
  ///   If any intermediate value is not an object, the behavior is undefined and may crash.
  public subscript(_ key: String, _ nestedKeys: String...) -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    var value = pointee.getProperty(jsiRuntime, key)

    for key in nestedKeys {
      value = value.getObject(jsiRuntime).getProperty(jsiRuntime, key)
    }
    return JavaScriptValue(runtimeHandle, value)
  }

  /// Returns an array of the object's own enumerable property names.
  /// This method is equivalent to JavaScript's `Object.keys()`, returning only properties
  /// that are enumerable and directly owned by the object (not inherited from the prototype chain).
  ///
  /// - Returns: An array of property names as strings
  public func getPropertyNames() -> [String] {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let propertyNames: facebook.jsi.Array = pointee.getPropertyNames(jsiRuntime)
    let count = propertyNames.size(jsiRuntime)

    return (0..<count).map { i in
      return String(jsiString: propertyNames.getValueAtIndex(jsiRuntime, i).getString(jsiRuntime), in: jsiRuntime)
    }
  }

  /// Calls `body` with the name and the value of each enumerable property of the object, in the order of
  /// `getPropertyNames()`. Like `jsi::Object::getPropertyNames`, it includes enumerable properties that the
  /// object inherits, as `for...in` does. The value is lent as a `JavaScriptUnownedValue`, valid only for the
  /// duration of the call. Each value is read with the `jsi::String` name from the property names array,
  /// so unlike `getPropertyNames()` followed by `getProperty(_:)`, no name is converted back from Swift.
  public func forEachProperty(_ body: (String, borrowing JavaScriptUnownedValue) throws -> Void) rethrows {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let propertyNames: facebook.jsi.Array = pointee.getPropertyNames(jsiRuntime)
    let count = propertyNames.size(jsiRuntime)

    for i in 0..<count {
      let name = propertyNames.getValueAtIndex(jsiRuntime, i).getString(jsiRuntime)
      let property = pointee.getProperty(jsiRuntime, name)
      let swiftName = String(jsiString: name, in: jsiRuntime)
      try withUnowned(property, in: jsiRuntime) { value in
        try body(swiftName, value)
      }
    }
  }

  /// Same as `getProperty(name).getObject()`, but throws instead of aborting when the property is
  /// not an object.
  public func getPropertyAsObject(_ name: String) throws -> JavaScriptObject {
    let property = getProperty(name)
    guard property.isObject() else {
      throw PropertyNotObjectError(name: name)
    }
    return property.getObject()
  }

  /// Same as `getProperty(propName).getObject()`, but throws instead of aborting when the property is
  /// not an object.
  public func getPropertyAsObject(_ propName: JavaScriptPropNameID) throws -> JavaScriptObject {
    let property = getProperty(propName)
    guard property.isObject() else {
      throw PropertyNotObjectError(name: propName.utf8())
    }
    return property.getObject()
  }

  /// Same as `getProperty(name).getObject().getFunction()`, but throws instead of aborting when the
  /// property is missing or not callable.
  public func getPropertyAsFunction(_ name: String) throws -> JavaScriptFunction {
    let property = getProperty(name)
    guard property.isFunction() else {
      throw PropertyNotFunctionError(name: name)
    }
    return property.getFunction()
  }

  /// Same as `getProperty(propName).getObject().getFunction()`, but throws instead of aborting when the
  /// property is missing or not callable.
  public func getPropertyAsFunction(_ propName: JavaScriptPropNameID) throws -> JavaScriptFunction {
    let property = getProperty(propName)
    guard property.isFunction() else {
      throw PropertyNotFunctionError(name: propName.utf8())
    }
    return property.getFunction()
  }

  /// Returns a prototype of the object. Same as `Object.getPrototypeOf(object)` in JS.
  public func getPrototype() -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, pointee.getPrototype(jsiRuntime))
  }

  /// Sets a prototype of the object. Same as `Object.setPrototypeOf(object, prototype)` in JS.
  public func setPrototype(_ prototype: borrowing JavaScriptValue) {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    pointee.setPrototype(jsiRuntime, prototype.pointee)
  }

  // MARK: - Modifying object properties

  public func setProperty(_ name: String, value: borrowing JavaScriptValue) {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    // This specialization is to avoid copying the value; `asValue()` on `JavaScriptValue` needs to do a copy.
    expo.setProperty(
      jsiRuntime,
      pointee,
      name.toJSIPropNameID(in: jsiRuntime),
      value.toJSIValue(in: jsiRuntime)
    )
  }

  /// Sets the property of the object with the given prop name id to the value.
  public func setProperty(_ propName: JavaScriptPropNameID, value: borrowing JavaScriptValue) {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    expo.setProperty(jsiRuntime, pointee, propName.pointee, value.toJSIValue(in: jsiRuntime))
  }

  /// Encodes `value` with ``JavaScriptEncodable/encode(_:into:in:)``, in the runtime of the object, straight
  /// into the engine value that the property is set to. A number, a boolean or a string then never becomes a
  /// ``JavaScriptValue``, whose moves and destroys call into the engine.
  @inlinable
  @JavaScriptActor
  public func setProperty<T: JavaScriptEncodable & ~Copyable>(
    _ propName: JavaScriptPropNameID,
    encoding value: consuming T
  ) throws {
    // Inlinable, so the encode specializes in the caller's module. The closure can't consume a captured
    // value, so the value moves out of an optional, as in the default `encode(_:into:in:)`.
    var pending: T? = .some(value)
    try setProperty(propName) { slot, runtime in
      try T.encode(pending.take()!, into: slot, in: runtime)
    }
  }

  /// Same as the `JavaScriptPropNameID` overload of `setProperty(_:encoding:)`, for a property named by a
  /// string.
  @inlinable
  @JavaScriptActor
  public func setProperty<T: JavaScriptEncodable & ~Copyable>(
    _ name: String,
    encoding value: consuming T
  ) throws {
    var pending: T? = .some(value)
    try setProperty(name) { slot, runtime in
      try T.encode(pending.take()!, into: slot, in: runtime)
    }
  }

  /// Sets the property to the value that `encode` writes into the slot, in the runtime of the object, for a
  /// value that has no `JavaScriptEncodable` conformance to pass to `setProperty(_:encoding:)`, such as a
  /// tuple. `encode` must write exactly one value unless it throws (see ``JavaScriptValue/Slot``). The
  /// slot is a temporary engine value that holds `undefined` until then, and it's destroyed after the
  /// property is set. Not inlinable, so the runtime is read from the handle here rather than in the caller.
  public func setProperty(
    _ propName: borrowing JavaScriptPropNameID,
    encodingWith encode: @JavaScriptActor (borrowing JavaScriptValue.Slot, borrowing JavaScriptRuntime) throws -> Void
  ) rethrows {
    guard let jsiRuntime, let runtime = runtimeHandle.unretainedRuntime else {
      FatalError.runtimeLost()
    }
    try withEncodedValue(encode, in: runtime) { value in
      expo.setProperty(jsiRuntime, pointee, propName.pointee, value)
    }
  }

  /// Same as the `JavaScriptPropNameID` overload of `setProperty(_:encodingWith:)`, for a property named by a
  /// string.
  public func setProperty(
    _ name: String,
    encodingWith encode: @JavaScriptActor (borrowing JavaScriptValue.Slot, borrowing JavaScriptRuntime) throws -> Void
  ) rethrows {
    guard let jsiRuntime, let runtime = runtimeHandle.unretainedRuntime else {
      FatalError.runtimeLost()
    }
    try withEncodedValue(encode, in: runtime) { value in
      expo.setProperty(jsiRuntime, pointee, name.toJSIPropNameID(in: jsiRuntime), value)
    }
  }

  public func setProperty<T: JavaScriptRepresentable & ~Copyable>(_ name: String, value: consuming T) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let jsiValue = value.toJavaScriptValue(in: runtime).toJSIValue(in: runtime.pointee)
    expo.setProperty(runtime.pointee, pointee, name.toJSIPropNameID(in: runtime.pointee), jsiValue)
  }

  internal func setProperty<T: JavaScriptRepresentable>(_ name: String, value: consuming T) where T: JSIRepresentable {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let jsiValue = value.toJSIValue(in: jsiRuntime)
    expo.setProperty(jsiRuntime, pointee, name.toJSIPropNameID(in: jsiRuntime), jsiValue)
  }

  public func setProperty(_ name: String, _ object: consuming JavaScriptObject) {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    expo.setProperty(
      jsiRuntime,
      pointee,
      name.toJSIPropNameID(in: jsiRuntime),
      facebook.jsi.Value(jsiRuntime, object.pointee)
    )
  }

  /// Sets a property to a synchronous host function created from the given closure. The function
  /// is named after the property and runs the closure when called from JavaScript, returning its
  /// result synchronously. Equivalent to `setProperty(name, runtime.createFunction(name) { … })`.
  @JavaScriptActor
  public func setProperty(_ name: String, function: sending @escaping JavaScriptRuntime.SyncFunctionClosure) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(name, value: runtime.createFunction(name, function))
  }

  /// Sets a property to a synchronous host function whose closure receives `this` as a borrowed
  /// ``JavaScriptUnownedValue`` instead of an owning ``JavaScriptValue`` (see
  /// ``JavaScriptRuntime/UnownedThisSyncFunctionClosure``). Use it for a function that usually ignores
  /// `this`, to skip the per-call owning-value allocation and `weak`-runtime churn.
  ///
  /// `@_disfavoredOverload` for the same reason as ``JavaScriptRuntime/createFunction(_:_:)-(String,_)``:
  /// an untyped closure parameter stays on the owning overload; only an explicit `borrowing
  /// JavaScriptUnownedValue` first parameter selects this one.
  @_disfavoredOverload
  @JavaScriptActor
  public func setProperty(
    _ name: String,
    function: sending @escaping JavaScriptRuntime.UnownedThisSyncFunctionClosure
  ) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(name, value: runtime.createFunction(name, function))
  }

  /// Sets a property to a host function created from a ``JavaScriptRuntime/VoidFunctionClosure``.
  @_disfavoredOverload
  @JavaScriptActor
  public func setProperty(_ name: String, function: sending @escaping JavaScriptRuntime.VoidFunctionClosure) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(name, value: runtime.createFunction(name, function))
  }

  /// Sets a property to a host function created from a ``JavaScriptRuntime/HostFunctionClosure``, which
  /// writes its result into the engine's result slot.
  @_disfavoredOverload
  @JavaScriptActor
  public func setProperty(_ name: String, function: sending @escaping JavaScriptRuntime.HostFunctionClosure) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(name, value: runtime.createFunction(name, function))
  }

  /// Sets a property named after it to an asynchronous host function created from the given closure.
  /// Equivalent to `setProperty(name, runtime.createAsyncFunction(name) { … })`. Returning an
  /// ``JavaScriptRuntime/AsyncFunctionBody`` from the closure selects this overload over the
  /// synchronous `setProperty(_:_:)`.
  @JavaScriptActor
  public func setProperty(_ name: String, function: sending @escaping JavaScriptRuntime.AsyncFunctionClosure) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(name, value: runtime.createAsyncFunction(name, function))
  }

  /// Deletes a property with the given name. After calling this function,
  /// `hasProperty` will return `false`, and `getProperty` will return `undefined` value.
  #if !os(macOS)
  // TODO: remove when bumping to react-native-macos 0.86
  public func deleteProperty(_ name: String) {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    pointee.deleteProperty(jsiRuntime, name.toJSIPropNameID(in: jsiRuntime))
  }
  #endif

  /// Defines a property with the given descriptor object, like `Reflect.defineProperty` in JavaScript. The
  /// object stays unchanged when it doesn't accept the property, for example when it's frozen.
  public func defineProperty(_ name: String, descriptor: consuming JavaScriptObject) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    // Filled with borrowed values, rather than passed as a pack, which takes copyable refs only.
    var arguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 3)
    arguments = arguments.set(value: self, atIndex: 0)
    arguments = arguments.set(value: name, atIndex: 1)
    arguments = arguments.set(value: descriptor, atIndex: 2)
    do {
      try definePropertyFunction(in: runtime).function.call(arguments: arguments)
    } catch {
      FatalError.definePropertyFailed(name, error)
    }
  }

  /// Defines a property with the given descriptor, like `Reflect.defineProperty` in JavaScript. The object
  /// stays unchanged when it doesn't accept the property, for example when it's frozen.
  public func defineProperty(_ name: String, descriptor: consuming PropertyDescriptor = .init()) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let defineProperty = definePropertyFunction(in: runtime)
    let jsiRuntime = runtime.pointee
    let hasValue = descriptor.value != nil
    let writable = descriptor.writable
    let enumerable = descriptor.enumerable
    let configurable = descriptor.configurable
    let value = descriptor.value ?? JavaScriptValue.undefined()
    var utf8Name = name
    utf8Name.withUTF8 { nameUtf8 in
      // A JS error can't propagate through Swift, so `capturingCppErrors` captures it and rethrows it
      // here; `defineProperty` doesn't throw, so it stops execution with that error.
      do {
        try capturingCppErrors {
          expo.defineProperty(
            jsiRuntime,
            defineProperty.function.pointee,
            defineProperty.configurableKey.pointee,
            defineProperty.enumerableKey.pointee,
            defineProperty.writableKey.pointee,
            defineProperty.valueKey.pointee,
            pointee,
            // An empty buffer may have no base address; any non-null pointer works with a zero length.
            nameUtf8.baseAddress ?? UnsafePointer(bitPattern: 1)!,
            nameUtf8.count,
            value.pointee,
            hasValue,
            writable,
            enumerable,
            configurable
          )
        }
      } catch {
        FatalError.definePropertyFailed(name, error)
      }
    }
  }

  /// Defines a property that holds the given value, like `Reflect.defineProperty` in JavaScript. The object
  /// stays unchanged when it doesn't accept the property, for example when it's frozen.
  public func defineProperty<T: JavaScriptRepresentable & ~Copyable>(
    _ name: String,
    value: borrowing T,
    options: PropertyOptions = []
  ) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let descriptor = PropertyDescriptor(
      configurable: options.contains(.configurable),
      enumerable: options.contains(.enumerable),
      writable: options.contains(.writable),
      value: value.toJavaScriptValue(in: runtime)
    )
    defineProperty(name, descriptor: descriptor)
  }

  /// Defines a property whose value is created on the first read. That read calls `factory`, encodes its result
  /// and replaces the property with a data property that holds the value, so later reads don't run native code.
  ///
  /// `.enumerable` applies before and after the first read. `.configurable` and `.writable` apply to the data
  /// property only. Before the first read, the property is always configurable, so the getter can replace it,
  /// and it has no setter, so an assignment fails.
  ///
  /// `factory` gets the object that the property is read from (`this`), which isn't this object when the read
  /// goes through the prototype chain, for example when this object is the prototype of a class and the read is
  /// on an instance. The getter defines the value on `this` too, so each object that inherits the property gets
  /// its own value, and the getter doesn't capture this object, which would keep it alive. When `this` isn't an
  /// object, the read returns the value and defines nothing. When `factory` throws, the property stays lazy and
  /// the next read calls `factory` again. When `this` doesn't accept the new property, for example when it's
  /// frozen, each read calls `factory`.
  @JavaScriptActor
  public func defineLazyProperty<T: JavaScriptEncodable & ~Copyable>(
    _ name: String,
    options: PropertyOptions = [.configurable, .enumerable],
    factory:
      sending @escaping @JavaScriptActor (
        _ this: borrowing JavaScriptUnownedValue,
        _ runtime: borrowing JavaScriptRuntime
      ) throws -> T
  ) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let descriptor = Self.lazyPropertyDescriptor(.name(name), options: options, factory: factory, in: runtime)
    defineProperty(name, descriptor: descriptor)
  }

  /// Defines a property under a symbol, such as `Symbol.iterator` or `Symbol.for("app.id")`, whose value is
  /// created on the first read. It works like ``defineLazyProperty(_:options:factory:)``.
  ///
  /// - Throws: An error when the runtime can't get the symbol, for example a well-known symbol that the engine
  ///   doesn't define. The object stays unchanged.
  @JavaScriptActor
  public func defineLazyProperty<T: JavaScriptEncodable & ~Copyable>(
    symbol: JavaScriptSymbol.Shared,
    options: PropertyOptions = [.configurable, .enumerable],
    factory:
      sending @escaping @JavaScriptActor (
        _ this: borrowing JavaScriptUnownedValue,
        _ runtime: borrowing JavaScriptRuntime
      ) throws -> T
  ) throws {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let key = try JavaScriptSymbol(runtime, symbol)
    let descriptor = Self.lazyPropertyDescriptor(.symbol(symbol), options: options, factory: factory, in: runtime)
    defineProperty(key, descriptor: descriptor)
  }

  /// The key under which a lazy getter defines the data property. The getter gets a symbol key again from its
  /// ``JavaScriptSymbol/Shared`` value, so the getter, which the runtime owns, keeps no engine value.
  private enum LazyPropertyKey {
    case name(String)
    case symbol(JavaScriptSymbol.Shared)
  }

  /// Creates the accessor descriptor of a lazy property: a getter that calls `factory` and defines the data
  /// property under `key` on `this`.
  @JavaScriptActor
  private static func lazyPropertyDescriptor<T: JavaScriptEncodable & ~Copyable>(
    _ key: LazyPropertyKey,
    options: PropertyOptions,
    factory:
      sending @escaping @JavaScriptActor (
        _ this: borrowing JavaScriptUnownedValue,
        _ runtime: borrowing JavaScriptRuntime
      ) throws -> T,
    in runtime: JavaScriptRuntime
  ) -> JavaScriptObject {
    // The getter has no name: a name costs about 90 ns for each property, and the first read replaces
    // the getter.
    let getter = runtime.createHostFunction(nil) {
      (
        this: borrowing JavaScriptUnownedValue,
        arguments: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      let value = try T.encode(factory(this, runtime), in: runtime)
      if this.isObject() {
        let descriptor = PropertyDescriptor(
          configurable: options.contains(.configurable),
          enumerable: options.contains(.enumerable),
          writable: options.contains(.writable),
          value: value.copy()
        )
        let object = this.getObject(in: runtime)
        switch key {
        case .name(let name):
          object.defineProperty(name, descriptor: descriptor)
        case .symbol(let symbol):
          object.defineProperty(try JavaScriptSymbol(runtime, symbol), descriptor: descriptor)
        }
      }
      result.emplace(value)
    }
    let keys = definePropertyFunction(in: runtime)
    let descriptor = runtime.createObject()
    descriptor.setProperty(keys.getKey, value: getter.takeValue())
    descriptor.setProperty(keys.configurableKey, value: JavaScriptValue(runtime, true))
    descriptor.setProperty(keys.enumerableKey, value: JavaScriptValue(runtime, options.contains(.enumerable)))
    return descriptor
  }

  // MARK: - Properties with symbol keys

  // The functions take only the closure types that `@JS(symbol:)` bindings generate.

  /// Sets a property with a symbol key to a host function created from a
  /// ``JavaScriptRuntime/VoidFunctionClosure``. The function is named after the symbol, as JavaScript
  /// names a method with a symbol key: the description of the symbol in brackets, such as
  /// `[Symbol.iterator]`.
  @_disfavoredOverload
  @JavaScriptActor
  public func setProperty(
    _ symbol: borrowing JavaScriptSymbol,
    function: sending @escaping JavaScriptRuntime.VoidFunctionClosure
  ) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(
      JavaScriptPropNameID(runtime, symbol: symbol),
      value: runtime.createFunction(symbol.functionName, function).takeValue()
    )
  }

  /// Sets a property with a symbol key to a host function created from a
  /// ``JavaScriptRuntime/HostFunctionClosure``, which writes its result into the engine's result slot. The
  /// function is named after the symbol.
  @_disfavoredOverload
  @JavaScriptActor
  public func setProperty(
    _ symbol: borrowing JavaScriptSymbol,
    function: sending @escaping JavaScriptRuntime.HostFunctionClosure
  ) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(
      JavaScriptPropNameID(runtime, symbol: symbol),
      value: runtime.createFunction(symbol.functionName, function).takeValue()
    )
  }

  /// Sets a property with a symbol key to an asynchronous host function created from the given closure. The
  /// function is named after the symbol.
  @JavaScriptActor
  public func setProperty(
    _ symbol: borrowing JavaScriptSymbol,
    function: sending @escaping JavaScriptRuntime.AsyncFunctionClosure
  ) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    setProperty(
      JavaScriptPropNameID(runtime, symbol: symbol),
      value: runtime.createAsyncFunction(symbol.functionName, function).takeValue()
    )
  }

  /// Defines a property with a symbol key and the given descriptor object, like `Reflect.defineProperty` in
  /// JavaScript. The object stays unchanged when it doesn't accept the property, for example when it's frozen.
  public func defineProperty(_ symbol: borrowing JavaScriptSymbol, descriptor: consuming JavaScriptObject) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    var arguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 3)
    arguments = arguments.set(value: self, atIndex: 0)
    arguments = arguments.set(value: symbol, atIndex: 1)
    arguments = arguments.set(value: descriptor, atIndex: 2)
    do {
      try definePropertyFunction(in: runtime).function.call(arguments: arguments)
    } catch {
      FatalError.definePropertyFailed(symbol.toString(), error)
    }
  }

  /// Defines a property with a symbol key and the given descriptor, like `Reflect.defineProperty` in
  /// JavaScript. The object stays unchanged when it doesn't accept the property, for example when it's frozen.
  public func defineProperty(_ symbol: borrowing JavaScriptSymbol, descriptor: consuming PropertyDescriptor = .init()) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let defineProperty = definePropertyFunction(in: runtime)
    let descriptorObject = runtime.createObject()
    descriptorObject.setProperty(
      defineProperty.configurableKey,
      value: JavaScriptValue(runtime, descriptor.configurable)
    )
    descriptorObject.setProperty(defineProperty.enumerableKey, value: JavaScriptValue(runtime, descriptor.enumerable))
    // Like the `String` overload, a descriptor without a value is a data descriptor that holds `undefined`.
    descriptorObject.setProperty(defineProperty.writableKey, value: JavaScriptValue(runtime, descriptor.writable))
    if let value = descriptor.value {
      descriptorObject.setProperty(defineProperty.valueKey, value: value)
    }
    self.defineProperty(symbol, descriptor: descriptorObject)
  }

  /// Defines a property with a symbol key that holds the given value, like `Reflect.defineProperty` in
  /// JavaScript. The object stays unchanged when it doesn't accept the property, for example when it's frozen.
  public func defineProperty<T: JavaScriptRepresentable & ~Copyable>(
    _ symbol: borrowing JavaScriptSymbol,
    value: borrowing T,
    options: PropertyOptions = []
  ) {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let descriptor = PropertyDescriptor(
      configurable: options.contains(.configurable),
      enumerable: options.contains(.enumerable),
      writable: options.contains(.writable),
      value: value.toJavaScriptValue(in: runtime)
    )
    defineProperty(symbol, descriptor: descriptor)
  }

  // MARK: - Calling owned functions

  /// Compact form of `object.getPropertyAsFunction(functionName).call(this: object, arguments: ...)`.
  @discardableResult
  @JavaScriptActor
  public func callFunction<each T: JavaScriptRepresentable>(_ functionName: String, arguments: repeat each T) throws
    -> JavaScriptValue
  {
    return try getPropertyAsFunction(functionName).call(this: self, arguments: repeat each arguments)
  }

  /// Compact form of `object.getPropertyAsFunction(functionName).call(this: object, arguments: ...)`.
  @discardableResult
  @JavaScriptActor
  public func callFunction<each T: JavaScriptRepresentable>(
    _ functionName: JavaScriptPropNameID,
    arguments: repeat each T
  ) throws -> JavaScriptValue {
    return try getPropertyAsFunction(functionName).call(this: self, arguments: repeat each arguments)
  }

  // MARK: - Conversions

  public func asValue() -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    assert(runtime?.isOnOwningThread() ?? true, "A JavaScript value was copied off its runtime's JavaScript thread")
    return JavaScriptValue(runtimeHandle, facebook.jsi.Value(jsiRuntime, pointee))
  }

  /// Moves the object into a `JavaScriptValue`, without the clone that ``asValue()`` makes.
  public consuming func takeValue() -> JavaScriptValue {
    return JavaScriptValue(runtimeHandle, expo.takeValueFromObject(&pointee))
  }

  /// Returns the object as a `facebook.jsi.Value` instance.
  internal func asJSIValue() -> facebook.jsi.Value {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return facebook.jsi.Value(jsiRuntime, pointee)
  }

  /// Provides scoped access to a raw pointer to the underlying `facebook.jsi.Object`.
  /// The pointer is valid only for the duration of the closure and must not be stored or escaped.
  public func withUnsafePointee<R>(_ body: (UnsafeRawPointer) throws -> R) rethrows -> R {
    return try withUnsafeBytes(of: pointee) { bytes in
      return try body(bytes.baseAddress!)
    }
  }

  /// Provides scoped mutable access to a raw pointer to the underlying `facebook.jsi.Object`.
  /// The pointer is valid only for the duration of the closure and must not be stored or escaped.
  public mutating func withUnsafeMutablePointee<R>(_ body: (UnsafeMutableRawPointer) throws -> R) rethrows -> R {
    return try withUnsafeMutableBytes(of: &pointee) { bytes in
      return try body(bytes.baseAddress!)
    }
  }

  /// Creates a weak reference to the object. If the only references to an object are these, the object is eligible for GC.
  public func createWeak() -> JavaScriptWeakObject {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptWeakObject(runtime, self)
  }

  // MARK: - Native state

  /// Returns whether this object carries an `expo::NativeState`-derived JSI native
  /// state — either one attached from Swift via `setNativeState`, or one produced
  /// C++-side (e.g. via `addListener`'s `EventEmitter::NativeState`). A `true`
  /// result does not imply that `getNativeState()` will return a non-nil Swift
  /// wrapper: C++-produced states carry a null context and are unrecoverable from
  /// the Swift side by design.
  public func hasNativeState() -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return expo.hasNativeState(jsiRuntime, pointee)
  }

  /// Returns the Swift `JavaScriptNativeState` wrapper attached to this object via
  /// `setNativeState`, or `nil` if there is no native state, the state was
  /// produced C++-side without a Swift back-pointer, or its concrete type doesn't
  /// match `T`. Inlinable, so the cast to `T` is specialized in the caller's module.
  @inlinable
  public func getNativeState<T: JavaScriptNativeState>(as: T.Type = JavaScriptNativeState.self) -> T? {
    return swiftNativeState() as? T
  }

  /// Returns the Swift `JavaScriptNativeState` wrapper attached to this object, of any type, or `nil`.
  @usableFromInline
  internal func swiftNativeState() -> JavaScriptNativeState? {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    guard let cxxNativeState = expo.getExpoNativeState(jsiRuntime, pointee),
      let context = cxxNativeState.pointee.getContext()
    else {
      return nil
    }
    // The context is a retained pointer to the wrapper (see `JavaScriptNativeState.acquireShared()`).
    return Unmanaged<JavaScriptNativeState>.fromOpaque(context).takeUnretainedValue()
  }

  /// Sets the internal native state property of this object, overwriting any old value.
  /// Creates a new shared_ptr to the object managed by state, which will live until the value at this property becomes unreachable.
  /// The engine refuses a frozen object, a Proxy and a host object. Use ``trySetNativeState(_:)`` for an object
  /// that can be one of those.
  public func setNativeState<T: JavaScriptNativeState>(_ nativeState: T) {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    expo.setNativeState(jsiRuntime, self.pointee, nativeState.acquireShared())
  }

  /// Sets the native state of this object, like ``setNativeState(_:)``. Returns `false` when the engine doesn't
  /// allow it, for example when the object is frozen, a Proxy or a host object; the object then stays unchanged.
  public func trySetNativeState<T: JavaScriptNativeState>(_ nativeState: T) -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return expo.trySetNativeState(jsiRuntime, self.pointee, nativeState.acquireShared())
  }

  /// Sets the native state of this object only while its underlying C++ native state is alive, that is, while
  /// another object holds it, in this runtime or in another one. Unlike `setNativeState(_:)`, it never creates
  /// a new C++ native state. Use it when the destructor of the C++ native state has side effects, which must not
  /// apply to this object when the previous C++ native state is being destroyed on another thread.
  /// Returns `false`, and leaves the object unchanged, when the C++ native state isn't alive.
  @discardableResult
  public func setNativeStateIfAlive<T: JavaScriptNativeState>(_ nativeState: T) -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    guard let shared = nativeState.acquireSharedIfAlive() else {
      return false
    }
    expo.setNativeState(jsiRuntime, self.pointee, shared)
    return true
  }

  /// Unsets the native state of this object. Does nothing when the engine doesn't allow it, for example when
  /// the object is frozen; use `tryUnsetNativeState()` to find out.
  public func unsetNativeState() {
    tryUnsetNativeState()
  }

  /// Unsets the native state of this object. Returns `false` when the engine doesn't allow it, for example
  /// when the object is frozen; the native state then stays attached.
  @discardableResult
  public func tryUnsetNativeState() -> Bool {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return expo.unsetNativeState(jsiRuntime, pointee)
  }

  // MARK: - Memory pressure

  public func setExternalMemoryPressure(_ size: Int) {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    expo.setExternalMemoryPressure(jsiRuntime, pointee, size)
  }

  // MARK: - Equality

  /// Compares whether the two `JavaScriptObject`s are pointing to the same underlying JS object.
  public static func == (lhs: borrowing JavaScriptObject, rhs: borrowing JavaScriptObject) -> Bool {
    // Note that we implement comparison operator, but we don't add conformance to `Equatable` because it requires types to be copyable.
    // This proposal solves it: https://github.com/swiftlang/swift-evolution/blob/main/proposals/0499-support-non-copyable-simple-protocols.md
    return lhs.asValue() == rhs.asValue()
  }

  // MARK: - Property options and descriptor

  /// Options for defining property attributes on JavaScript objects. These options correspond to the property
  /// descriptor attributes in JavaScript's `Object.defineProperty()` method. They control how a property behaves when
  /// accessed, enumerated, or modified.
  ///
  /// - SeeAlso: `PropertyDescriptor` for more fine-grained control over property definitions
  @frozen
  public struct PropertyOptions: OptionSet, Sendable {
    public let rawValue: Int

    // `@frozen` with an inlinable initializer, so a client module specializes an options literal such as
    // `[.configurable, .enumerable]`. The options stay stored `static let`s, so the module keeps exporting the
    // symbols that modules built against an earlier version use.

    @inlinable
    public init(rawValue: Int) {
      self.rawValue = rawValue
    }
    /// When `true`, the property descriptor may be changed and the property may be deleted.
    /// Default is `false` when not specified.
    ///
    /// Corresponds to JavaScript's `configurable` property attribute. A configurable property
    /// can have its descriptor redefined or be deleted from the object.
    public static let configurable = PropertyOptions(rawValue: 1 << 0)
    /// When `true`, the property shows up during enumeration of properties.
    /// Default is `false` when not specified.
    ///
    /// Corresponds to JavaScript's `enumerable` property attribute. Enumerable properties
    /// appear in `for...in` loops and `Object.keys()` results.
    public static let enumerable = PropertyOptions(rawValue: 1 << 1)
    /// When `true`, the property's value can be changed with an assignment operator.
    /// Default is `false` when not specified.
    ///
    /// Corresponds to JavaScript's `writable` property attribute. Writable properties
    /// can be modified after they are defined.
    public static let writable = PropertyOptions(rawValue: 1 << 2)
  }
  /// A descriptor that defines the characteristics of a property on a JavaScript object.
  /// Property descriptors provide fine-grained control over how properties behave,
  /// corresponding directly to JavaScript's property descriptor objects used with
  /// `Object.defineProperty()`. Each descriptor specifies whether the property is
  /// configurable, enumerable, writable, and what value it should hold.
  ///
  /// - Note: All boolean properties default to `false`, matching JavaScript's behavior
  ///   when properties are defined via `Object.defineProperty()`.
  /// - SeeAlso: `PropertyOptions` for a simpler option-set based approach
  public struct PropertyDescriptor: ~Copyable {
    /// When `true`, the property descriptor may be changed and the property may be deleted from the object.
    let configurable: Bool

    /// When `true`, the property shows up during enumeration (e.g., `for...in` loops, `Object.keys()`).
    let enumerable: Bool

    /// When `true`, the property's value can be changed with an assignment operator.
    let writable: Bool

    /// The value associated with the property. Can be any JavaScript value or `nil`.
    let value: JavaScriptValue?

    /// Creates a new property descriptor with the specified attributes.
    ///
    /// - Parameters:
    ///   - configurable: Whether the property can be deleted or have its descriptor modified. Defaults to `false`.
    ///   - enumerable: Whether the property appears during enumeration. Defaults to `false`.
    ///   - writable: Whether the property's value can be changed. Defaults to `false`.
    ///   - value: The value to assign to the property. Defaults to `nil`.
    /// - Note: When all parameters use their default values, this creates a non-configurable,
    ///   non-enumerable, non-writable property with no value (undefined in JavaScript).
    public init(
      configurable: Bool = false,
      enumerable: Bool = false,
      writable: Bool = false,
      value: consuming JavaScriptValue? = nil
    ) {
      self.configurable = configurable
      self.enumerable = enumerable
      self.writable = writable
      self.value = value
    }
    /// Converts the descriptor to a JavaScript object that can be used with `Object.defineProperty()`.
    /// This method creates a JavaScript object with the descriptor's attributes set as properties.
    /// Only attributes that are `true` or non-nil are included in the resulting object,
    /// following JavaScript conventions.
    ///
    /// - Parameter runtime: The JavaScript runtime in which to create the descriptor object
    /// - Returns: A JavaScript object representing this property descriptor
    public consuming func toObject(_ runtime: borrowing JavaScriptRuntime) -> JavaScriptObject {
      let object = runtime.createObject()
      if configurable {
        object.setProperty("configurable", value: true)
      }
      if enumerable {
        object.setProperty("enumerable", value: true)
      }
      if writable {
        object.setProperty("writable", value: true)
      }
      switch value {
      case .some(let value):
        object.setProperty("value", value: value)
      case .none:
        break
      }
      return object
    }
  }
}

extension JavaScriptObject: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: borrowing JavaScriptValue) -> JavaScriptObject {
    return value.getObject()
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptObject: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> JavaScriptObject
  {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}

// MARK: - JavaScriptCodable

// A `JavaScriptObject` argument receives the JS value unconverted, like `JavaScriptValue`, but checked for
// its kind: decoding anything else throws a `TypeError`. The typed wrapper is what the macros steer to
// in place of a free-form `[String: Any]`.
//
// The unowned overload is the one a host function argument takes: it reads the kind off the borrowed
// `jsi::Value` and clones it straight into the wrapper, where the default would first clone it into an
// owning `JavaScriptValue` and then again into the wrapper.
extension JavaScriptObject: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .object
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptObject
  {
    return try value.asObject()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptObject
  {
    return try value.asObject(in: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: consuming JavaScriptObject, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return value.takeValue()
  }
}

// MARK: - Errors

extension JavaScriptObject {
  public struct PropertyNotFunctionError: Error, CustomStringConvertible {
    let name: String

    public var description: String {
      return "Property '\(name)' is not a function"
    }
  }

  public struct PropertyNotObjectError: Error, CustomStringConvertible {
    let name: String

    public var description: String {
      return "Property '\(name)' is not an object"
    }
  }
}

// MARK: - Reflect.defineProperty

/// Holds the runtime's `Reflect.defineProperty` and the property names of a descriptor, created once per
/// runtime instead of on every `defineProperty` call.
internal final class DefinePropertyFunction {
  let function: JavaScriptFunction
  let configurableKey: JavaScriptPropNameID
  let enumerableKey: JavaScriptPropNameID
  let writableKey: JavaScriptPropNameID
  let valueKey: JavaScriptPropNameID
  let getKey: JavaScriptPropNameID

  init(_ function: consuming JavaScriptFunction, in runtime: JavaScriptRuntime) {
    self.function = function
    self.configurableKey = JavaScriptPropNameID(runtime, string: "configurable")
    self.enumerableKey = JavaScriptPropNameID(runtime, string: "enumerable")
    self.writableKey = JavaScriptPropNameID(runtime, string: "writable")
    self.valueKey = JavaScriptPropNameID(runtime, string: "value")
    self.getKey = JavaScriptPropNameID(runtime, string: "get")
  }
}

/// Returns the runtime's `Reflect.defineProperty`, cached in the runtime. Property definitions run on the
/// JavaScript thread like every other JSI call, which is where the runtime's cache is isolated.
private func definePropertyFunction(in runtime: JavaScriptRuntime) -> DefinePropertyFunction {
  return JavaScriptActor.assumeIsolated {
    runtime.cached(JavaScriptRuntime.CacheKeys.reflectDefineProperty) {
      do {
        let function = try runtime.global().getPropertyAsObject("Reflect").getPropertyAsFunction("defineProperty")
        return DefinePropertyFunction(function, in: runtime)
      } catch {
        FatalError.definePropertyUnavailable(error)
      }
    }
  }
}

/// Calls `encode` with a slot in a temporary engine value and the runtime, then `body` with the value it
/// wrote. A value that `encode` doesn't write stays `undefined`. The value is destroyed when `body`
/// returns, which calls into the engine only for a value with an engine handle.
///
/// Nonisolated, like `JavaScriptValuesBuffer.withEmplacedValues`: an isolated closure passed to the
/// standard library checks the current executor on every call, so only `encode` runs isolated.
private func withEncodedValue(
  _ encode: @JavaScriptActor (borrowing JavaScriptValue.Slot, borrowing JavaScriptRuntime) throws -> Void,
  in runtime: Unmanaged<JavaScriptRuntime>,
  _ body: (borrowing facebook.jsi.Value) -> Void
) rethrows {
  try withUnsafeTemporaryAllocation(of: facebook.jsi.Value.self, capacity: 1) { buffer in
    // The isolated closure below runs synchronously on this thread.
    nonisolated(unsafe) let slot = buffer.baseAddress!
    expo.emplaceUndefined(slot)
    defer {
      expo.destroyValues(slot, 1)
    }
    // The runtime can't be deallocated during a call on its JavaScript thread, so it's borrowed without
    // a retain.
    try runtime._withUnsafeGuaranteedRef { runtime in
      try JavaScriptActor.assumeIsolated {
        try encode(JavaScriptValue.Slot(slot), runtime)
      }
    }
    body(slot.pointee)
  }
}
