// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A protocol for classes/structs accepted as an argument of functions.
 */
public protocol AnyArgument {
  static func getDynamicType() -> AnyDynamicType
}

extension AnyArgument {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicRawType(innerType: Self.self)
  }
}

// Extend the primitive types — these may come from React Native bridge.
extension Bool: AnyArgument {}

extension Int: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: Int.self)
  }
}
extension Int8: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: Int8.self)
  }
}
extension Int16: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: Int16.self)
  }
}
extension Int32: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: Int32.self)
  }
}
extension Int64: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: Int64.self)
  }
}

extension UInt: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: UInt.self)
  }
}
extension UInt8: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: UInt8.self)
  }
}
extension UInt16: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: UInt16.self)
  }
}
extension UInt32: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: UInt32.self)
  }
}
extension UInt64: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: UInt64.self)
  }
}

extension Float32: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: Float32.self)
  }
}
extension Double: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: Double.self)
  }
}

extension CGFloat: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicNumberType(numberType: CGFloat.self)
  }
}

extension String: AnyArgument {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicStringType.shared
  }
}

extension Optional: AnyArgument where Wrapped: AnyArgument {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicOptionalType(wrappedType: ~Wrapped.self)
  }
}

extension Dictionary: AnyArgument where Key: Hashable {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicDictionaryType(valueType: ~Value.self)
  }
}

extension Array: AnyArgument {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicArrayType(elementType: ~Element.self)
  }
}

extension Data: AnyArgument {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicDataType.shared
  }
}
