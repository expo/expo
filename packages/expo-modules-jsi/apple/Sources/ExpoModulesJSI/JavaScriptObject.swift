// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

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
  public init<DictValue: JSRepresentable>(_ runtime: JavaScriptRuntime, _ dictionary: [String: DictValue]) {
    self.runtime = runtime
    self.pointee = dictionary.toJSValue(in: runtime).getObject().pointee
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

  public func isArray() -> Bool {
    return pointee.isArray(runtime.pointee)
  }

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

  public func getArray() -> JavaScriptArray {
    return JavaScriptArray(runtime: runtime, pointee: pointee.getArray(runtime.pointee))
  }

  // MARK: - Accessing object properties

  public func hasProperty(_ name: String) -> Bool {
    return pointee.hasProperty(runtime.pointee, name)
  }

  public func getProperty(_ name: String) -> JavaScriptValue {
    return JavaScriptValue(runtime, pointee.getProperty(runtime.pointee, name))
  }

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
   Same as `getProperty(name).getObject().getFunction()`.
   */
  public func getPropertyAsFunction(_ name: String) -> JavaScriptFunction {
    return JavaScriptFunction(runtime, pointee.getPropertyAsFunction(runtime.pointee, name))
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

  public func setProperty(_ name: String, _ bool: Bool) {
    expo.setProperty(runtime.pointee, pointee, name, bool)
  }

  public func setProperty(_ name: String, _ double: Double) {
    expo.setProperty(runtime.pointee, pointee, name, double)
  }

  public func setProperty(_ name: String, value: JavaScriptValue) {
    // This specialization is to avoid copying the value; `asValue()` on `JavaScriptValue` needs to do a copy.
    expo.setProperty(runtime.pointee, pointee, name, value.toJSIValue(in: runtime.pointee))
  }

  public func setProperty<T: JSRepresentable & ~Copyable>(_ name: String, value: consuming T) {
    let jsiValue = value.toJSValue(in: runtime).toJSIValue(in: runtime.pointee)
    expo.setProperty(runtime.pointee, pointee, name, jsiValue)
  }

  internal func setProperty<T: JSRepresentable>(_ name: String, value: consuming T) where T: JSIRepresentable {
    let jsiValue = value.toJSIValue(in: runtime.pointee)
    expo.setProperty(runtime.pointee, pointee, name, jsiValue)
  }

  public func setProperty(_ name: String, _ object: consuming JavaScriptObject) {
    expo.setProperty(runtime.pointee, pointee, name, facebook.jsi.Value(runtime.pointee, object.pointee))
  }

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

  public func defineProperty<T: JSRepresentable & ~Copyable>(_ name: String, value: borrowing T, options: PropertyOptions = []) {
    let descriptor = PropertyDescriptor(
      configurable: options.contains(.configurable),
      enumerable: options.contains(.enumerable),
      writable: options.contains(.writable),
      value: value.toJSValue(in: runtime)
    )
    defineProperty(name, descriptor: descriptor)
  }

  // MARK: - Calling owned functions

  /**
   Compact form of `object.getPropertyAsFunction(functionName).call(this: object, arguments: ...)`.
   */
  @discardableResult
  @JavaScriptActor
  public func callFunction<each T: JSRepresentable>(_ functionName: String, arguments: repeat each T) throws -> JavaScriptValue {
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
  public func getNativeState<T: NativeState>(as: T.Type = NativeState.self) -> T? {
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
  public func setNativeState<T: NativeState>(_ nativeState: T) {
    guard let nativeStatePointee = nativeState.pointee else {
      fatalError("Native state is already released")
    }
    expo.setNativeState(runtime.pointee, pointee, nativeStatePointee)
  }

  /**
   Unsets the native state of this object.
   */
  public func unsetNativeState() {
    expo.unsetNativeState(runtime.pointee, pointee)
  }

  // MARK: - Deallocator

  public func setObjectDeallocator(_ deallocator: @escaping () -> Void) {
    expo.common.setDeallocator(runtime.pointee, pointee, deallocator)
  }

  // MARK: - Memory pressure

  public func setExternalMemoryPressure(_ size: Int) {
    pointee.setExternalMemoryPressure(runtime.pointee, size)
  }
}

extension JavaScriptObject: JSRepresentable {
  public static func fromJSValue(_ value: JavaScriptValue) -> JavaScriptObject {
    return value.getObject()
  }

  public func toJSValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptObject: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> JavaScriptObject {
    fatalError("Unimplemented")
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}

public struct PropertyOptions: OptionSet, Sendable {
  public let rawValue: Int
  
  public init(rawValue: Int) {
    self.rawValue = rawValue
  }
  
  public static let configurable = PropertyOptions(rawValue: 1 << 0)
  public static let enumerable = PropertyOptions(rawValue: 1 << 1)
  public static let writable = PropertyOptions(rawValue: 1 << 2)
}

public struct PropertyDescriptor: ~Copyable {
  let configurable: Bool
  let enumerable: Bool
  let writable: Bool
  let value: JavaScriptValue?

  public init(configurable: Bool = false, enumerable: Bool = false, writable: Bool = false, value: JavaScriptValue? = nil) {
    self.configurable = configurable
    self.enumerable = enumerable
    self.writable = writable
    self.value = value
  }

  public consuming func toObject(_ runtime: borrowing JavaScriptRuntime) -> JavaScriptObject {
    let object = runtime.createObject()
    if configurable {
      object.setProperty("configurable", true)
    }
    if enumerable {
      object.setProperty("enumerable", true)
    }
    if writable {
      object.setProperty("writable", true)
    }
    if let value {
      object.setProperty("value", value: value)
    }
    return object
  }
}
