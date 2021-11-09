// Copyright 2021-present 650 Industries. All rights reserved.

/**
 An argument type that wraps any type conforming to `ConvertibleArgument` protocol.
 */
internal struct ConvertibleArgumentType: AnyArgumentType {
  let innerType: ConvertibleArgument.Type

  func cast<ArgType>(_ value: ArgType) throws -> Any {
    return try innerType.convert(from: value)
  }

  var description: String {
    String(describing: innerType.self)
  }
}
