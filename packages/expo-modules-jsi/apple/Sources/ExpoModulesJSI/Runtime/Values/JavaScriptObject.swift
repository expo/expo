// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 A Swift representation of a JavaScript object. Provides access to JavaScript object properties and methods,
 supporting property access, modification, enumeration, prototype manipulation, and function calling.
 */
public struct JavaScriptObject: JavaScriptType, Sendable, ~Copyable {
  internal let runtime: JavaScriptRuntime
  internal var pointee: facebook.jsi.Object

  /**
   Creates a new object in the given runtime.
   */
  public init(_ runtime: JavaScriptRuntime) {
    self.init(runtime, facebook.jsi.Object(runtime.pointee))
  }

  /**
   Creates a new object from the dictionary whose values are representable in JS.
   */
  public init<DictValue: JavaScriptRepresentable>(_ runtime: JavaScriptRuntime, _ dictionary: [String: DictValue]) {
    self.runtime = runtime
    self.pointee = dictionary.toJavaScriptValue(in: runtime).getObject().pointee
  }

//  public init(_ runtime: JavaScriptRuntime, _ object: UnsafeRawPointer) {
//    self.runtime = runtime
//    self.pointee = object.load(as: facebook.jsi.Object.self)
//  }

  /**
   Creates a new object from existing JSI object.
   */
  internal/*!*/ init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.Object) {
    self.runtime = runtime
    self.pointee = object
  }

  /**
   Result of `object instanceof constructor`, which tests if the prototype property of a constructor appears anywhere in the prototype chain of an object.
   */
  public func instanceOf(_ constructor: borrowing JavaScriptFunction) -> Bool {
    return pointee.instanceOf(runtime.pointee, constructor.pointee)
  }

  /**
   Result of `object instanceof constructor`, which tests if the prototype property of a constructor appears anywhere in the prototype chain of an object.
   */
  public func instanceOf(_ constructor: JavaScriptValue) -> Bool {
    return instanceOf(constructor.getFunction())
  }

  /**
   Equivalent to `Array.isArray()` in JS. If it returns `true`, then `getArray()` will succeed.
   */
  public func isArray() -> Bool {
    return pointee.isArray(runtime.pointee)
  }

  /**
   Returns `true` if the object is callable. If so, then `getFunction()` will succeed.
   */
  public func isFunction() -> Bool {
    return pointee.isFunction(runtime.pointee)
  }

// TODO: `isHostObject` is ambiguous for Swift as it's a template – we need specialization in C++
//  public func isHostObject() -> Bool {
//    return pointee.isHostObject(runtime.pointee)
//  }

  public func isArrayBuffer() -> Bool {
    return pointee.isArrayBuffer(runtime.pointee)
  }

  /**
   Returns the object as an array, or asserts if not an array.
   */
  public func getArray() -> JavaScriptArray {
    assert(isArray(), "Object is not an array")
    return JavaScriptArray(runtime, pointee.getArray(runtime.pointee))
  }

  /**
   Returns the object as a function, or asserts if not a function.
   */
  public func getFunction() -> JavaScriptFunction {
    assert(isFunction(), "Object is not a function")
    return JavaScriptFunction(runtime, pointee.getFunction(runtime.pointee))
  }

  // MARK: - Accessing object properties

  /**
   Checks whether the object has a property with the given name.
   */
  public func hasProperty(_ name: String) -> Bool {
    return pointee.hasProperty(runtime.pointee, name)
  }

  /**
   Returns the property of the object with the given name,
   or `undefined` value if the name is not a property of the object.
   */
  public func getProperty(_ name: String) -> JavaScriptValue {
    return JavaScriptValue(runtime, pointee.getProperty(runtime.pointee, name))
  }

  /**
   Accesses nested properties in a single subscript operation by traversing the object chain.
   This subscript provides a convenient way to access deeply nested properties without
   multiple chained calls to `getProperty()`. Each key in the chain is accessed sequentially,
   treating intermediate values as objects.

   - Parameters:
     - key: The first property name to access on this object
     - nestedKeys: Variadic list of subsequent property names to access on nested objects
   - Returns: The `JavaScriptValue` at the end of the property chain
   - Note: Each intermediate value in the chain (except the last) must be an object.
     If any intermediate value is not an object, the behavior is undefined and may crash.
   */
  public subscript(_ key: String, _ nestedKeys: String...) -> JavaScriptValue {
    let jsiRuntime = runtime.pointee
    var value = pointee.getProperty(jsiRuntime, key)

    for key in nestedKeys {
      value = value.getObject(jsiRuntime).getProperty(jsiRuntime, key)
    }
    return JavaScriptValue(runtime, value)
  }

  /**
   Returns an array of the object's own enumerable property names.
   This method is equivalent to JavaScript's `Object.keys()`, returning only properties
   that are enumerable and directly owned by the object (not inherited from the prototype chain).

   - Returns: An array of property names as strings
   */
  public func getPropertyNames() -> [String] {
    let jsiRuntime = runtime.pointee
    let propertyNames: facebook.jsi.Array = pointee.getPropertyNames(jsiRuntime)
    let count = propertyNames.size(jsiRuntime)

    return (0..<count).map { i in
      return String(propertyNames.getValueAtIndex(jsiRuntime, i).getString(jsiRuntime).utf8(jsiRuntime))
    }
  }

  /**
   Same as `getProperty(name).getObject()`.
   */
  public func getPropertyAsObject(_ name: String) -> JavaScriptObject {
    return JavaScriptObject(runtime, pointee.getPropertyAsObject(runtime.pointee, name))
  }

  /**
   Same as `getProperty(propName).getObject()`.
   */
  public func getPropertyAsObject(_ propName: JavaScriptPropNameID) -> JavaScriptObject {
    return JavaScriptObject(runtime, pointee.getProperty(runtime.pointee, propName.pointee).getObject(runtime.pointee))
  }

  /**
   Same as `getProperty(name).getObject().getFunction()`.
   */
  public func getPropertyAsFunction(_ name: String) -> JavaScriptFunction {
    return JavaScriptFunction(runtime, pointee.getPropertyAsFunction(runtime.pointee, name))
  }

  /**
   Same as `getProperty(propName).getObject().getFunction()`.
   */
  public func getPropertyAsFunction(_ propName: JavaScriptPropNameID) -> JavaScriptFunction {
    let jsiFunction = pointee.getProperty(runtime.pointee, propName.pointee).getObject(runtime.pointee).getFunction(runtime.pointee)
    return JavaScriptFunction(runtime, jsiFunction)
  }

  /**
   Returns a prototype of the object. Same as `Object.getPrototypeOf(object)` in JS.
   */
  public func getPrototype() -> JavaScriptValue {
    return JavaScriptValue(runtime, pointee.getPrototype(runtime.pointee))
  }

  /**
   Sets a prototype of the object. Same as `Object.setPrototypeOf(object, prototype)` in JS.
   */
  public func setPrototype(_ prototype: JavaScriptValue) {
    pointee.setPrototype(runtime.pointee, prototype.pointee)
  }

  // MARK: - Modifying object properties

  public func setProperty(_ name: String, value: JavaScriptValue) {
    // This specialization is to avoid copying the value; `asValue()` on `JavaScriptValue` needs to do a copy.
    expo.setProperty(runtime.pointee, pointee, name, value.toJSIValue(in: runtime.pointee))
  }

  public func setProperty<T: JavaScriptRepresentable & ~Copyable>(_ name: String, value: consuming T) {
    let jsiValue = value.toJavaScriptValue(in: runtime).toJSIValue(in: runtime.pointee)
    expo.setProperty(runtime.pointee, pointee, name, jsiValue)
  }

  internal func setProperty<T: JavaScriptRepresentable>(_ name: String, value: consuming T) where T: JSIRepresentable {
    let jsiValue = value.toJSIValue(in: runtime.pointee)
    expo.setProperty(runtime.pointee, pointee, name, jsiValue)
  }

  public func setProperty(_ name: String, _ object: consuming JavaScriptObject) {
    expo.setProperty(runtime.pointee, pointee, name, facebook.jsi.Value(runtime.pointee, object.pointee))
  }

  /**
   Deletes a property with the given name. After calling this function,
   `hasProperty` will return `false`, and `getProperty` will return `undefined` value.
   */
  public func deleteProperty(_ name: String) {
    pointee.deleteProperty(runtime.pointee, name)
  }

  public func defineProperty(_ name: String, descriptor: consuming JavaScriptObject) {
    try! runtime
      .global()
      .getPropertyAsObject("Object")
      .getPropertyAsFunction("defineProperty")
      .call(arguments: self.asValue().ref(), JavaScriptValue(runtime, name).ref(), descriptor.ref())
  }

  public func defineProperty(_ name: String, descriptor: consuming PropertyDescriptor = .init()) {
    let descriptorObject = descriptor.toObject(runtime)
    defineProperty(name, descriptor: descriptorObject)
  }

  public func defineProperty<T: JavaScriptRepresentable & ~Copyable>(_ name: String, value: borrowing T, options: PropertyOptions = []) {
    let descriptor = PropertyDescriptor(
      configurable: options.contains(.configurable),
      enumerable: options.contains(.enumerable),
      writable: options.contains(.writable),
      value: value.toJavaScriptValue(in: runtime)
    )
    defineProperty(name, descriptor: descriptor)
  }

  // MARK: - Calling owned functions

  /**
   Compact form of `object.getPropertyAsFunction(functionName).call(this: object, arguments: ...)`.
   */
  @discardableResult
  @JavaScriptActor
  public func callFunction<each T: JavaScriptRepresentable>(_ functionName: String, arguments: repeat each T) throws -> JavaScriptValue {
    return try getPropertyAsFunction(functionName).call(this: self, arguments: repeat each arguments)
  }

  /**
   Compact form of `object.getPropertyAsFunction(functionName).call(this: object, arguments: ...)`.
   */
  @discardableResult
  @JavaScriptActor
  public func callFunction<each T: JavaScriptRepresentable>(_ functionName: JavaScriptPropNameID, arguments: repeat each T) throws -> JavaScriptValue {
    return try getPropertyAsFunction(functionName).call(this: self, arguments: repeat each arguments)
  }

  // MARK: - Conversions

  public func asValue() -> JavaScriptValue {
    return JavaScriptValue(runtime, facebook.jsi.Value(runtime.pointee, pointee))
  }

  /**
   Returns the object as a `facebook.jsi.Value` instance.
   */
  internal func asJSIValue() -> facebook.jsi.Value {
    return facebook.jsi.Value(runtime.pointee, pointee)
  }

  /**
   Creates a weak reference to the object. If the only references to an object are these, the object is eligible for GC.
   */
  public func createWeak() -> JavaScriptWeakObject {
    return JavaScriptWeakObject(runtime, self)
  }

  // MARK: - Native state

  /**
   Returns whether this object has native state previously set by `setNativeState`.
   */
  public func hasNativeState() -> Bool {
    return expo.hasNativeState(runtime.pointee, pointee)
  }

  /**
   Returns a native state previously set by `setNativeState`.
   If `hasNativeState()` is false or object's native state is of unrelated type, this will return `nil`.
   */
  public func getNativeState<T: JavaScriptNativeState>(as: T.Type = JavaScriptNativeState.self) -> T? {
    guard let cxxNativeState = expo.getNativeState(runtime.pointee, pointee) else {
      return nil
    }
    return T.from(cxx: cxxNativeState)
  }

  /**
   Sets the internal native state property of this object, overwriting any old value.
   Creates a new shared_ptr to the object managed by state, which will live until the value at this property becomes unreachable.
   - TODO: throw a type error if this object is a proxy or host object.
   */
  public func setNativeState<T: JavaScriptNativeState>(_ nativeState: T) {
    guard let nativeStatePointee = nativeState.pointee else {
      FatalError.nativeStateReleased()
    }
    expo.setNativeState(runtime.pointee, pointee, nativeStatePointee)
  }

  /**
   Unsets the native state of this object.
   */
  public func unsetNativeState() {
    expo.unsetNativeState(runtime.pointee, pointee)
  }

  // MARK: - Memory pressure

  public func setExternalMemoryPressure(_ size: Int) {
    pointee.setExternalMemoryPressure(runtime.pointee, size)
  }

  // MARK: - Equality

  /**
   Compares whether the two `JavaScriptObject`s are pointing to the same underlying JS object.
   */
  public static func == (lhs: borrowing JavaScriptObject, rhs: borrowing JavaScriptObject) -> Bool {
    // Note that we implement comparison operator, but we don't add conformance to `Equatable` because it requires types to be copyable.
    // This proposal solves it: https://github.com/swiftlang/swift-evolution/blob/main/proposals/0499-support-non-copyable-simple-protocols.md
    return lhs.asValue() == rhs.asValue()
  }

  // MARK: - Property options and descriptor

  /**
   Options for defining property attributes on JavaScript objects. These options correspond to the property
   descriptor attributes in JavaScript's `Object.defineProperty()` method. They control how a property behaves when
   accessed, enumerated, or modified.

   - SeeAlso: `PropertyDescriptor` for more fine-grained control over property definitions
   */
  public struct PropertyOptions: OptionSet, Sendable {
    public let rawValue: Int

    public init(rawValue: Int) {
      self.rawValue = rawValue
    }
    /**
     When `true`, the property descriptor may be changed and the property may be deleted.
     Default is `false` when not specified.

     Corresponds to JavaScript's `configurable` property attribute. A configurable property
     can have its descriptor redefined or be deleted from the object.
     */
    public static let configurable = PropertyOptions(rawValue: 1 << 0)
    /**
     When `true`, the property shows up during enumeration of properties.
     Default is `false` when not specified.

     Corresponds to JavaScript's `enumerable` property attribute. Enumerable properties
     appear in `for...in` loops and `Object.keys()` results.
     */
    public static let enumerable = PropertyOptions(rawValue: 1 << 1)
    /**
     When `true`, the property's value can be changed with an assignment operator.
     Default is `false` when not specified.

     Corresponds to JavaScript's `writable` property attribute. Writable properties
     can be modified after they are defined.
     */
    public static let writable = PropertyOptions(rawValue: 1 << 2)
  }
  /**
   A descriptor that defines the characteristics of a property on a JavaScript object.
   Property descriptors provide fine-grained control over how properties behave,
   corresponding directly to JavaScript's property descriptor objects used with
   `Object.defineProperty()`. Each descriptor specifies whether the property is
   configurable, enumerable, writable, and what value it should hold.

   - Note: All boolean properties default to `false`, matching JavaScript's behavior
     when properties are defined via `Object.defineProperty()`.
   - SeeAlso: `PropertyOptions` for a simpler option-set based approach
   */
  public struct PropertyDescriptor: ~Copyable {
    /// When `true`, the property descriptor may be changed and the property may be deleted from the object.
    let configurable: Bool

    /// When `true`, the property shows up during enumeration (e.g., `for...in` loops, `Object.keys()`).
    let enumerable: Bool

    /// When `true`, the property's value can be changed with an assignment operator.
    let writable: Bool

    /// The value associated with the property. Can be any JavaScript value or `nil`.
    let value: JavaScriptValue?

    /**
     Creates a new property descriptor with the specified attributes.

     - Parameters:
       - configurable: Whether the property can be deleted or have its descriptor modified. Defaults to `false`.
       - enumerable: Whether the property appears during enumeration. Defaults to `false`.
       - writable: Whether the property's value can be changed. Defaults to `false`.
       - value: The value to assign to the property. Defaults to `nil`.
     - Note: When all parameters use their default values, this creates a non-configurable,
       non-enumerable, non-writable property with no value (undefined in JavaScript).
     */
    public init(configurable: Bool = false, enumerable: Bool = false, writable: Bool = false, value: JavaScriptValue? = nil) {
      self.configurable = configurable
      self.enumerable = enumerable
      self.writable = writable
      self.value = value
    }
    /**
     Converts the descriptor to a JavaScript object that can be used with `Object.defineProperty()`.
     This method creates a JavaScript object with the descriptor's attributes set as properties.
     Only attributes that are `true` or non-nil are included in the resulting object,
     following JavaScript conventions.

     - Parameter runtime: The JavaScript runtime in which to create the descriptor object
     - Returns: A JavaScript object representing this property descriptor
     */
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
      if let value {
        object.setProperty("value", value: value)
      }
      return object
    }
  }
}

extension JavaScriptObject: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> JavaScriptObject {
    return value.getObject()
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptObject: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> JavaScriptObject {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}
