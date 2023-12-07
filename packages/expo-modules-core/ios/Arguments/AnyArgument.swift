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

extension Int: AnyArgument {}
extension Int8: AnyArgument {}
extension Int16: AnyArgument {}
extension Int32: AnyArgument {}
extension Int64: AnyArgument {}

extension UInt: AnyArgument {}
extension UInt8: AnyArgument {}
extension UInt16: AnyArgument {}
extension UInt32: AnyArgument {}
extension UInt64: AnyArgument {}

extension Float32: AnyArgument {}
extension Double: AnyArgument {}
extension CGFloat: AnyArgument {}

extension String: AnyArgument {}

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
    return DynamicDataType()
  }
}
