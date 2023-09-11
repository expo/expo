// Copyright 2018-present 650 Industries. All rights reserved.

/**
 A protocol that allows custom classes or structs to be used as function arguments.
 It requires static `convert(from:)` function that knows how to convert incoming
 value of `Any` type to the type implemented by this protocol. It should throw an error
 when the value is not recognized, is invalid or doesn't meet type requirements.
 */
public protocol Convertible: AnyArgument {
  /**
   Converts any value to the instance of its class (or struct).
   Throws an error when given value cannot be converted.
   */
  static func convert(from value: Any?) throws -> Self
}

@available(*, deprecated, renamed: "Convertible")
public typealias ConvertibleArgument = Convertible
