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
    return try innerType.create(fromRawValue: value)
  }

  var description: String {
    "Enum<\(innerType)>"
  }
}
