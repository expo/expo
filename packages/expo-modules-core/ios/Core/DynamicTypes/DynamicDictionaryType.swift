// Copyright 2015-present 650 Industries. All rights reserved.

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
    let converter = appContext.converter

    if let jsObject = try? jsValue.asObject() {
      var result: [AnyHashable: Any] = [:]
      for key in jsObject.getPropertyNames() {
        result[key] = try converter.toNative(jsObject.getProperty(key), valueType)
      }
      return result
    }
    throw Conversions.CastingException<JavaScriptObject>(jsValue)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let value = value as? [AnyHashable: Any] {
      return try value.mapValues { try valueType.cast($0, appContext: appContext) }
    }
    throw Conversions.CastingException<[AnyHashable: Any]>(value)
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
