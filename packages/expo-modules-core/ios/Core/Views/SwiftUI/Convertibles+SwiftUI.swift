// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension Color: Convertible {
  public static func convert(from value: Any?) throws -> Color {
    return try swiftUIColorFromAny(value)
  }

  public static func convert(from value: Any?, appContext: AppContext) throws -> Color {
    return try convert(from: value)
  }
}

extension UnitPoint: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> UnitPoint {
    // Simply reuse the logic from CGPoint
    if let cgPoint = try? CGPoint.convert(from: value, appContext: appContext) {
      return UnitPoint(x: cgPoint.x, y: cgPoint.y)
    }
    throw Conversions.ConvertingException<UnitPoint>(value)
  }
}
