// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A dynamic type that wraps any type conforming to `Convertible` protocol.
 */
internal struct DynamicConvertibleType: AnyDynamicType {
  let innerType: Convertible.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let convertibleType = type as? Self {
      return convertibleType.innerType == innerType
    }
    return false
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    return try innerType.convert(from: value, appContext: appContext)
  }

  var description: String {
    String(describing: innerType.self)
  }
}
