// Copyright 2022-present 650 Industries. All rights reserved.

internal struct DynamicTypedArrayType: AnyDynamicType {
  let innerType: AnyTypedArray.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let typedArrayType = type as? Self {
      return typedArrayType.innerType == innerType
    }
    return false
  }

  func cast<ValueType>(_ value: ValueType) throws -> Any {
    // It must be a JavaScript typed array.
    guard let value = value as? JavaScriptValue, let jsTypedArray = value.getTypedArray() else {
      throw NotTypedArrayException(innerType)
    }
    let typedArray = TypedArray.create(from: jsTypedArray)

    // Concrete typed arrays must be the same as the inner type.
    guard innerType == TypedArray.self || type(of: typedArray) == innerType else {
      throw ArrayTypeMismatchException((received: type(of: typedArray), expected: innerType))
    }
    return typedArray
  }

  var description: String {
    return String(describing: innerType)
  }
}

internal final class ArrayTypeMismatchException: GenericException<(received: Any.Type, expected: Any.Type)> {
  override var reason: String {
    "Received a typed array of type \(param.received), expected \(param.expected)"
  }
}

internal final class NotTypedArrayException: GenericException<AnyTypedArray.Type> {
  override var reason: String {
    "Given argument is not an instance of \(param)"
  }
}
