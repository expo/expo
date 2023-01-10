// Copyright 2022-present 650 Industries. All rights reserved.

import SwiftUI

extension Color: Convertible {
  public static func convert(from value: Any?) throws -> Color {
    // Simply reuse the logic from UIColor
    if let uiColor = try? UIColor.convert(from: value) {
      return Color(uiColor)
    }
    throw Conversions.ConvertingException<Color>(value)
  }
}

extension UnitPoint: Convertible {
  public static func convert(from value: Any?) throws -> UnitPoint {
    // Simply reuse the logic from CGPoint
    if let cgPoint = try? CGPoint.convert(from: value) {
      return UnitPoint(x: cgPoint.x, y: cgPoint.y)
    }
    throw Conversions.ConvertingException<UnitPoint>(value)
  }
}
