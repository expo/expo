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

  /**
   Converts JS typed array to its native representation.
   */
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    guard let jsTypedArray = jsValue.getTypedArray() else {
      throw NotTypedArrayException(innerType)
    }
    return TypedArray.create(from: jsTypedArray)
  }

  /**
   Converts the given native `TypedArray` to a concrete typed array class wrapped by the dynamic type.
   Throws `ArrayTypeMismatchException` otherwise.
   */
  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    guard let typedArray = value as? TypedArray else {
      throw NotTypedArrayException(innerType)
    }
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
