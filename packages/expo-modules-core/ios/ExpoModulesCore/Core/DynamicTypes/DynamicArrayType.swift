// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type representing array types. Requires the array's element type
 for the initialization as it delegates casting to that type for each element in the array.
 */
internal struct DynamicArrayType: AnyDynamicType {
  let elementType: AnyDynamicType

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    if let ArrayType = InnerType.self as? AnyArray.Type {
      return elementType.equals(ArrayType.getElementDynamicType())
    }
    return false
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let arrayType = type as? Self {
      return arrayType.elementType.equals(elementType)
    }
    return false
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.isArray() {
      return try jsValue.getArray().map { value in
        return try elementType.cast(jsValue: value, appContext: appContext)
      }
    }
    // "Arrayize" the value if it's not an array.
    return [try elementType.cast(jsValue: jsValue, appContext: appContext)]
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let value = value as? [Any] {
      return try value.map { try elementType.cast($0, appContext: appContext) }
    }
    // We should probably throw an error if we get here. On the other side, the array type
    // requirement can be more loosen so we can try to arrayize values that are not arrays.
    return [try elementType.cast(value, appContext: appContext)]
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    if let result = result as? [Any] {
      return result.map { Conversions.convertFunctionResult($0, appContext: appContext) }
    }
    return result
  }

  /**
   Type-aware conversion for arrays that were already normalized by `convertResult`.
   Elements must use `castToJS` here to avoid re-entering `convertResult` for values that
   are already in their post-conversion shape, such as `JavaScriptValue.undefined`.
   */
  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return try castToJS(value, appContext: appContext, in: try appContext.runtime)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    guard let array = value as? [Any] else {
      return try Conversions.anyToJavaScriptValue(value, appContext: appContext, in: runtime)
    }
    let jsArray = runtime.createArray(length: array.count)
    for (index, element) in array.enumerated() {
      try jsArray.set(value: try elementType.castToJS(element, appContext: appContext, in: runtime), at: index)
    }
    return jsArray.asValue()
  }

  /**
   Converts original native arrays directly to JavaScript, allowing nested elements
   to use their own direct conversion paths before any array-level normalization.
   */
  func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return try convertToJS(value, appContext: appContext, in: try appContext.runtime)
  }

  func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    guard let array = value as? [Any] else {
      return try Conversions.anyToJavaScriptValue(value, appContext: appContext, in: runtime)
    }
    let jsArray = runtime.createArray(length: array.count)
    for (index, element) in array.enumerated() {
      try jsArray.set(value: try elementType.convertToJS(element, appContext: appContext, in: runtime), at: index)
    }
    return jsArray.asValue()
  }

  var description: String {
    "[\(elementType.description)]"
  }
}

/**
 A type-erased protocol used to recognize if the generic type is an array type.
 `Array` is a generic type, so it's impossible to check the inheritance directly.
 */
internal protocol AnyArray {
  /**
   Exposes the `Element` generic type wrapped by the dynamic type to preserve its metadata.
   */
  static func getElementDynamicType() -> AnyDynamicType
}

/**
 Extends the `Array` type to expose its generic `Element` as a dynamic type.
 */
extension Array: AnyArray {
  static func getElementDynamicType() -> AnyDynamicType {
    return ~Element.self
  }
}
