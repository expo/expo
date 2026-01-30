// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

public struct JavaScriptValue: JavaScriptType, Escapable, ~Copyable {
  internal weak var runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.Value

  /**
   Initializer from the existing JSI value.
   */
  internal init(_ runtime: JavaScriptRuntime?, _ pointee: consuming facebook.jsi.Value) {
    self.runtime = runtime
    self.pointee = pointee
  }

  /**
   Copy initializer from the existing JSI value.
   */
  internal init(_ runtime: JavaScriptRuntime, _ pointee: borrowing facebook.jsi.Value) {
    self.runtime = runtime
    self.pointee = facebook.jsi.Value(runtime.pointee, pointee)
  }

  /**
   Creates a boolean JS value.
   */
  public init(_ runtime: JavaScriptRuntime, _ bool: Bool) {
    self.runtime = runtime
    self.pointee = facebook.jsi.Value(bool)
  }

  /**
   Creates a JS value from a JS representable.
   */
  public init(_ runtime: JavaScriptRuntime, _ value: JSRepresentable) {
    self.runtime = runtime
    self.pointee = value.toJSValue(in: runtime).pointee
  }

  /**
   Creates a JS value from a JSI representable.
   */
  internal init(_ runtime: JavaScriptRuntime, _ value: JSIRepresentable) {
    self.runtime = runtime
    self.pointee = value.toJSIValue(in: runtime.pointee)
  }

  /**
   Copies the value.
   */
  public func copy() -> JavaScriptValue {
    if let runtime {
      return JavaScriptValue(runtime, facebook.jsi.Value(runtime.pointee, pointee))
    }
    // Some simple value kinds do not require the runtime.
    switch kind {
    case .undefined:
      return .undefined()
    case .null:
      return .null()
    case .bool:
      return .init(nil, facebook.jsi.Value(getBool()))
    case .number:
      return .init(nil, facebook.jsi.Value(getDouble()))
    default:
      JS.runtimeLostFatalError()
    }
  }

  public func isUndefined() -> Bool {
    return pointee.isUndefined()
  }

  public func isNull() -> Bool {
    return pointee.isNull()
  }

  public func isBool() -> Bool {
    return pointee.isBool()
  }

  public func isNumber() -> Bool {
    return pointee.isNumber()
  }

  public func isString() -> Bool {
    return pointee.isString()
  }

  public func isSymbol() -> Bool {
    return pointee.isSymbol()
  }

  public func isObject() -> Bool {
    return pointee.isObject()
  }

  public func isArray() -> Bool {
    guard let jsiRuntime = runtime?.pointee else {
      JS.runtimeLostFatalError()
    }
    return pointee.isObject() && pointee.getObject(jsiRuntime).isArray(jsiRuntime)
  }

  public func isFunction() -> Bool {
    guard let jsiRuntime = runtime?.pointee else {
      JS.runtimeLostFatalError()
    }
    return pointee.isObject() && pointee.getObject(jsiRuntime).isFunction(jsiRuntime)
  }

  public func isTypedArray() -> Bool {
    guard let jsiRuntime = runtime?.pointee else {
      JS.runtimeLostFatalError()
    }
    return pointee.isObject() && expo.isTypedArray(jsiRuntime, pointee.getObject(jsiRuntime))
  }

  /**
   Checks whether the value is an instance of a global class of the given name.
   */
  public func `is`(_ typeName: String) -> Bool {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return isObject() && getObject().instanceOf(runtime.global().getPropertyAsFunction(typeName))
  }

  public func getAny() -> Any {
    if isUndefined() || isNull() {
      return Any?.none as Any
    }
    if isBool() {
      return getBool()
    }
    if isNumber() {
      return getDouble()
    }
    if isString() {
      return getString()
    }
    if let object = isObject() ? getObject() : nil {
      if let array = object.isArray() ? object.getArray() : nil {
        let size = array.size
        var result = [Any]()

        result.reserveCapacity(size)

        for index in 0..<size {
          result.append(array.getValue(atIndex: index).getAny())
        }
        return result
      }
      if object.isFunction() {
        fatalError("Unimplemented")
      }
      var result = [String: Any]()

      for propertyName in object.getPropertyNames() {
        let property = object.getProperty(propertyName)
        result[propertyName] = property.getAny()
      }
      return result
    }
    fatalError("Unsupported value kind: \(kind)")
  }

  /**
   Returns the value as a boolean, or asserts if not a boolean.
   */
  public func getBool() -> Bool {
    assert(isBool(), "Value is not a boolean")
    return pointee.getBool()
  }

  /**
   Returns the value as an integer, or asserts if not a number.
   */
  public func getInt() -> Int {
    assert(isNumber(), "Value is not a number")
    return Int(pointee.getNumber())
  }

  /**
   Returns the value as a double, or asserts if not a number.
   */
  public func getDouble() -> Double {
    assert(isNumber(), "Value is not a number")
    return pointee.getNumber()
  }

  /**
   Returns the value as a string, or asserts if not a string.
   */
  public func getString() -> String {
    guard let jsiRuntime = runtime?.pointee else {
      JS.runtimeLostFatalError()
    }
    assert(isString(), "Value is not a string")
    return String(pointee.getString(jsiRuntime).utf16(jsiRuntime))
  }

  /**
   Returns the value as an object, or asserts if not an object.
   */
  public func getObject() -> JavaScriptObject {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    assert(isObject(), "Value is not an object")
    return JavaScriptObject(runtime, pointee.getObject(runtime.pointee))
  }

  /**
   Returns the value as a function, or asserts if not a function.
   */
  public func getFunction() -> JavaScriptFunction {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    assert(isFunction(), "Value is not a function")
    return JavaScriptFunction(runtime, pointee.getObject(runtime.pointee).getFunction(runtime.pointee))
  }

  /**
   Returns the value as a typed array, or asserts if it is not a typed array.
   */
  public func getTypedArray() -> JavaScriptTypedArray? {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    guard isTypedArray() else {
      return nil
    }
    return JavaScriptTypedArray(runtime, expo.TypedArray(runtime.pointee, pointee.getObject(runtime.pointee)))
  }

  /**
   Returns a string representing the value. Same as calling `toString()` in JS.
   */
  public func toString() -> String {
    guard let jsiRuntime = runtime?.pointee else {
      JS.runtimeLostFatalError()
    }
    return String(pointee.toString(jsiRuntime).utf16(jsiRuntime))
  }

  /**
   Same as calling `JSON.stringify` with this value, given replacer and space.
   */
  public func jsonStringify(replacer: consuming JavaScriptValue? = nil, space: consuming JavaScriptValue? = nil) throws -> String? {
    guard let runtime else {
      // Some types do not need the runtime. Handle them before crashing due to missing runtime.
      switch kind {
      case .undefined:
        return nil
      case .null:
        return "null"
      case .bool:
        return getBool() ? "true" : "false"
      case .number:
        return String(getDouble())
      default:
        JS.runtimeLostFatalError()
      }
    }
    let value = try runtime
      .global()
      .getPropertyAsObject("JSON")
      .getPropertyAsFunction("stringify")
      .call(arguments: copy().ref(), replacer?.ref(), space?.ref())
    return value.isString() ? value.getString() : nil
  }

  // MARK: - JavaScriptType

  public func asValue() -> JavaScriptValue {
    // We need to copy the value as `self` would be borrowed
    return copy()
  }

  // MARK: - Kind

  public enum Kind: String {
    case undefined
    case null
    case bool
    case number
    case symbol
    case string
    case function
    case object
  }

  public var kind: Kind {
    // TODO: Make it a stored property, but computed on demand.
    // This feels like a better way to check value's type.
    switch true {
    case isUndefined():
      return .undefined
    case isNull():
      return .null
    case isBool():
      return .bool
    case isNumber():
      return .number
    case isSymbol():
      return .symbol
    case isString():
      return .string
    case isFunction():
      return .function
    default:
      return .object
    }
  }

  // MARK: - Equality

  /**
   Tests whether two values are strictly equal, according to https://262.ecma-international.org/11.0/#sec-strict-equality-comparison
   */
  public func isEqual(to another: borrowing JavaScriptValue) -> Bool {
    if let jsiRuntime = runtime?.pointee ?? another.runtime?.pointee {
      return facebook.jsi.Value.strictEquals(jsiRuntime, pointee, another.pointee)
    }
    // Some types don't have to be tied to any runtime. Since `strictEquals` needs a runtime, we need to handle this case ourselves.
    let thisKind = kind
    if thisKind != another.kind {
      return false
    }
    switch thisKind {
    case .undefined, .null:
      return true
    case .number:
      return getDouble() == another.getDouble()
    case .bool:
      return getBool() == another.getBool()
    default:
      return false
    }
  }

  /**
   Same as `isEqual(to:)`.
   */
  public static func == (lhs: borrowing Self, rhs: borrowing Self) -> Bool {
    // Note that we implement comparison operator, but we don't add conformance to `Equatable` because it requires types to be copyable.
    // This proposal solves it: https://github.com/swiftlang/swift-evolution/blob/main/proposals/0499-support-non-copyable-simple-protocols.md
    return lhs.isEqual(to: rhs)
  }

  /**
   Negates the result of `isEqual(to:)`.
   */
  public static func != (lhs: borrowing Self, rhs: borrowing Self) -> Bool {
    return !lhs.isEqual(to: rhs)
  }

  // MARK: - Runtime-free initializers

  public static func undefined() -> JavaScriptValue {
    return JavaScriptValue(nil, facebook.jsi.Value.undefined())
  }

  public static func null() -> JavaScriptValue {
    return JavaScriptValue(nil, facebook.jsi.Value.null())
  }

  public static func `true`() -> JavaScriptValue {
    return JavaScriptValue(nil, facebook.jsi.Value(true))
  }

  public static func `false`() -> JavaScriptValue {
    return JavaScriptValue(nil, facebook.jsi.Value(false))
  }

  public static func number(_ number: Double) -> JavaScriptValue {
    return JavaScriptValue(nil, facebook.jsi.Value(number))
  }

  public static func representing(value: JSRepresentable, in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return value.toJSValue(in: runtime)
  }

  @available(*, deprecated, renamed: "representing(value:in:)")
  public static func from(_ value: Any, runtime: JavaScriptRuntime) -> JavaScriptValue {
    if let value = value as? JSRepresentable {
      return value.toJSValue(in: runtime)
    }
    return .undefined()
  }
}

extension JavaScriptValue: JSRepresentable {
  public static func fromJSValue(_ value: borrowing JavaScriptValue) -> JavaScriptValue {
    return value.copy()
  }

  public func toJSValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    // `self` is borrowed, so we need to do a copy here
    return self.copy()
  }
}

extension JavaScriptValue: JSIRepresentable {
  public/*!*/ static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> JavaScriptValue {
    fatalError("Unimplemented")
  }

  public/*!*/ func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return facebook.jsi.Value(runtime, pointee)
  }
}
