// Copyright 2021-present 650 Industries. All rights reserved.

/**
 An argument type representing array types. Requires the argument type for
 array's element type as it delegates casting to that type for each element in the array.
 */
internal struct ArrayArgumentType: AnyArgumentType {
  let elementType: AnyArgumentType

  func cast<ArgType>(_ value: ArgType) throws -> Any {
    if let value = value as? [Any] {
      return try value.map { try elementType.cast($0) }
    }
    // We should probably throw an error if we get here. On the other side, the array type
    // requirement can be more loosen so we can try to arrayize values that are not arrays.
    return [try elementType.cast(value)]
  }

  var description: String {
    "[\(elementType.description)]"
  }
}

/**
 A type-erased protocol used to recognize arrays with elements of argument-compatible type.
 `Array` is a generic type, so it's impossible to check the inheritance directly.
 */
internal protocol AnyArrayArgument: AnyArgument {
  /**
   Exposes the `Element` generic type wrapped by the argument type to preserve its metadata.
   */
  static func getElementArgumentType() -> AnyArgumentType
}

/**
 Extends the `Array` type to expose its generic `Element` as an argument type.
 */
extension Array: AnyArrayArgument where Element: AnyArgument {
  static func getElementArgumentType() -> AnyArgumentType {
    return ArgumentType(Element.self)
  }
}
