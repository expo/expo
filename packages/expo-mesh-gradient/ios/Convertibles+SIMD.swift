// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// Declares convertible conformance to `SIMD2<Float>` type which is commonly used in many SwiftUI APIs.
extension SIMD2: @retroactive Convertible, AnyArgument where Scalar == Float {
  public static func convert(from value: Any?, appContext: AppContext) throws -> SIMD2<Float> {
    guard let values = value as? [Any] else {
      throw NotAnArrayException()
    }
    guard values.count == 2 else {
      throw IncorrectArraySizeException((expected: 2, actual: values.count))
    }
    if let values = values as? [Double] {
      // Numbers from JS always come as doubles.
      return SIMD2(Float(values[0]), Float(values[1]))
    }
    if let values = values as? [Float] {
      return SIMD2(values[0], values[1])
    }
    throw Conversions.ConvertingException<SIMD2<Float>>(value)
  }
}

internal final class NotAnArrayException: Exception {
  override var reason: String {
    "Given value is not an array"
  }
}

internal final class IncorrectArraySizeException: GenericException<(expected: Int, actual: Int)> {
  override var reason: String {
    "Given array has unexpected number of elements: \(param.actual), expected: \(param.expected)"
  }
}
