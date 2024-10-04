// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A protocol whose intention is to wrap any type
 to keep its real signature and not type-erase it by the compiler.
 */
public protocol AnyDynamicType: CustomStringConvertible {
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
   Preliminarily casts the given JavaScriptValue to a non-JS value that the other `cast` function can handle.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any

  /**
   Casts the given value to the wrapped type and returns it as `Any`.
   NOTE: It may not be just simple type-casting (e.g. when the wrapped type conforms to `Convertible`).
   */
  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue

  /**
   Converts function's result to the type that can later be converted to a JS value.
   For instance, types such as records, enumerables and shared objects need special handling
   and conversion to simpler types (dictionary, primitive value or specific JS value).
   */
  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any
}

extension AnyDynamicType {
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    return jsValue.getRaw() as Any
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    return value
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    // This conversion isn't the most efficient way to convert Objective-C value to JS value.
    // Better performance should be provided in dynamic type specializations.
    return try JavaScriptValue.from(value, runtime: appContext.runtime)
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
