// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A protocol that allows custom classes or structs to be used as function arguments.
 It requires static `convert(from:appContext:)` function that knows how to convert incoming
 value of `Any` type to the type implemented by this protocol. It should throw an error
 when the value is not recognized, is invalid or doesn't meet type requirements.
 */
public protocol Convertible: AnyArgument {
  /**
   Converts any value to the instance of its class (or struct) in the given app context.
   Throws an error when given value cannot be converted.
   */
  static func convert(from value: Any?, appContext: AppContext) throws -> Self
  static func convertResult(_ result: Any, appContext: AppContext) throws -> Any
}

extension Convertible {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicConvertibleType(innerType: Self.self)
  }
  public static func convertResult(_ result: Any, appContext: AppContext) throws -> Any {
    return result
  }
}

@available(*, deprecated, renamed: "Convertible")
public typealias ConvertibleArgument = Convertible
