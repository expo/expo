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
    // `getArray().map { $0 }` materializes the non-copyable `JavaScriptArray` into a
    // copyable `[JavaScriptValue]` so we can iterate it again below.
    let value = jsValue.isArray() ? jsValue.getArray().map { $0 } : [jsValue]
    return try value.map { try elementType.cast(jsValue: $0, appContext: appContext) }
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
   Type-aware conversion: converts each element using `elementType.castToJS` so types like
   `SharedObject` — which need per-type JS representations — are handled correctly when
   nested inside an array.
   */
  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    guard let array = value as? [Any] else {
      return try Conversions.anyToJavaScriptValue(value, runtime: appContext.runtime)
    }
    let runtime = try appContext.runtime
    let jsArray = runtime.createArray(length: array.count)
    for (index, element) in array.enumerated() {
      try jsArray.set(value: try elementType.castToJS(element, appContext: appContext), at: index)
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
