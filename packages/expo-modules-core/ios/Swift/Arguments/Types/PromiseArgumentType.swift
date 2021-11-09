// Copyright 2021-present 650 Industries. All rights reserved.

/**
 An argument type that represents the `Promise` argument.
 */
internal struct PromiseArgumentType: AnyArgumentType {
  func cast<ArgType>(_ value: ArgType) throws -> Any {
    if let value = value as? Promise {
      return value
    }
    throw Conversions.CastingError<Promise>(value: value)
  }

  var description: String = "Promise"
}
