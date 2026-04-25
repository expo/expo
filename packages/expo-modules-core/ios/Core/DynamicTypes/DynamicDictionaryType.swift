// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type representing dictionary types. Requires the dictionary's value type
 for the initialization as it delegates casting to that type for each element in the dictionary.
 */
internal struct DynamicDictionaryType: AnyDynamicType {
  let valueType: AnyDynamicType

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    if let dictionaryType = InnerType.self as? AnyDictionary.Type {
      return valueType.equals(dictionaryType.getValueDynamicType())
    }
    return false
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let dictionaryType = type as? Self {
      return dictionaryType.valueType.equals(valueType)
    }
    return false
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if let jsObject = try? jsValue.asObject() {
      var result: [AnyHashable: Any] = [:]
      for key in jsObject.getPropertyNames() {
        result[key] = try appContext.converter.toNative(jsObject.getProperty(key), valueType)
      }
      return result
    }
    throw Conversions.CastingJSValueException<[AnyHashable: Any]>(jsValue.kind)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let value = value as? [AnyHashable: Any] {
      return try value.mapValues { try valueType.cast($0, appContext: appContext) }
    }
    throw Conversions.CastingException<[AnyHashable: Any]>(value)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    if let result = result as? [AnyHashable: Any] {
      return result.mapValues { Conversions.convertFunctionResult($0, appContext: appContext) }
    }
    return result
  }

  /**
   Type-aware conversion: converts each value using `valueType.castToJS` so types like
   `SharedObject` — which need per-type JS representations — are handled correctly when
   nested inside a dictionary.
   */
  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    guard let dict = value as? [AnyHashable: Any] else {
      return try Conversions.anyToJavaScriptValue(value, runtime: appContext.runtime)
    }
    let runtime = try appContext.runtime
    let jsObject = runtime.createObject()
    for (key, element) in dict {
      guard let key = key as? String else { continue }
      jsObject.setProperty(key, value: try valueType.castToJS(element, appContext: appContext))
    }
    return jsObject.asValue()
  }

  var description: String {
    "[Hashable: \(valueType.description)]"
  }
}

/**
 A type-erased protocol used to recognize if the generic type is a dictionary type.
 `Dictionary` is a generic type, so it's impossible to check the inheritance directly.
 */
internal protocol AnyDictionary {
  /**
   Exposes the `Value` generic type wrapped by the dynamic type to preserve its metadata.
   */
  static func getValueDynamicType() -> AnyDynamicType
}

/**
 Extends the `Dictionary` type to expose its generic `Value` as a dynamic type.
 */
extension Dictionary: AnyDictionary {
  static func getValueDynamicType() -> AnyDynamicType {
    return ~Value.self
  }
}
