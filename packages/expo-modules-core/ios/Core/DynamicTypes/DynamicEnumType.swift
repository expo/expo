// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A dynamic type representing an enum that conforms to `Enumerable`.
 */
internal struct DynamicEnumType: AnyDynamicType {
  let innerType: any Enumerable.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let enumType = type as? Self {
      return enumType.innerType == innerType
    }
    return false
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    // TODO: Remove if. The result should not be an enumerable, but it's converted in `MainValueConverter:21` to an enum.
    if let value = value as? any Enumerable {
      return value
    }
    return try innerType.create(fromRawValue: value)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    if let result = result as? any Enumerable {
      return result.anyRawValue
    }
    return result
  }

  var description: String {
    "Enum<\(innerType)>"
  }
}
