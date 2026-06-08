// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A protocol whose intention is to wrap any type
 to keep its real signature and not type-erase it by the compiler.
 */
public protocol AnyDynamicType: CustomStringConvertible, Sendable {
  /**
   Checks whether the inner type is the same as the given type.
   */
  func wraps<InnerType>(_ type: InnerType.Type) -> Bool

  /**
   Checks whether the dynamic type is equal to another,
   that is when the type of the dynamic types are equal and their inner types are equal.
   */
  func equals(_ type: AnyDynamicType) -> Bool

  /**
   Casts the given JavaScript value to the final wrapped native value, ready to be
   handed to the function's underlying closure or stored in a record/prop.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  @JavaScriptActor
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any

  /**
   Casts the given Swift-side value to the wrapped type and returns it as `Any`.
   Used by record-field setters, view props, and other non-JS-origin paths that
   need to coerce a Swift value into the dynamic type's representation.
   NOTE: It may not be just simple type-casting (e.g. when the wrapped type conforms to `Convertible`).
   */
  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue

  /**
   Runtime-aware `castToJS`.
   */
  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue

  /**
   Converts the given native value directly to `JavaScriptValue`.
   The default implementation uses `convertResult` and then `castToJS`, but dynamic types
   can override it to avoid unnecessary intermediate representations.
   */
  func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue

  /**
   Runtime-aware `convertToJS`.
   */
  func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue

  /**
   Converts function's result to the type that can later be converted to a JS value.
   For instance, types such as records, enumerables and shared objects need special handling
   and conversion to simpler types (dictionary, primitive value or specific JS value).
   */
  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any
}

extension AnyDynamicType {
  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    return value
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return try Conversions.unknownToJavaScriptValue(value, appContext: appContext)
  }

  // Default forwards to the legacy `castToJS`, dropping `runtime`
  public func castToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    return try castToJS(value, appContext: appContext)
  }

  public func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    let result = Conversions.convertFunctionResult(value, appContext: appContext, dynamicType: self)
    return try castToJS(result, appContext: appContext)
  }

  public func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    let result = Conversions.convertFunctionResult(value, appContext: appContext, dynamicType: self)
    return try castToJS(result, appContext: appContext, in: runtime)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    return result
  }
}

// MARK: - Operators

infix operator ~>
public func ~> <T>(lhs: AnyDynamicType, rhs: T.Type) -> Bool {
  return lhs.wraps(rhs)
}

infix operator !~>
public func !~> <T>(lhs: AnyDynamicType, rhs: T.Type) -> Bool {
  return !lhs.wraps(rhs)
}

public func == (lhs: AnyDynamicType, rhs: AnyDynamicType) -> Bool {
  return lhs.equals(rhs)
}

public func != (lhs: AnyDynamicType, rhs: AnyDynamicType) -> Bool {
  return !lhs.equals(rhs)
}
