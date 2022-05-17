// Copyright 2021-present 650 Industries. All rights reserved.

/**
 An argument type that represents the `Promise` argument.
 */
internal struct PromiseArgumentType: AnyArgumentType {
  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == Promise.self
  }

  func equals(_ type: AnyArgumentType) -> Bool {
    return type is Self
  }

  func cast<ArgType>(_ value: ArgType) throws -> Any {
    if let value = value as? Promise {
      return value
    }
    throw Conversions.CastingException<Promise>(value)
  }

  var description: String = "Promise"
}
