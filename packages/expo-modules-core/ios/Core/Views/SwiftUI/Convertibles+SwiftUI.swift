// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension Color: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Color {
    // Simply reuse the logic from UIColor
    if let uiColor = try? UIColor.convert(from: value, appContext: appContext) {
      return Color(uiColor)
    }
    // Context-dependent colors
    if let stringValue = value as? String, let color = colorFromName(stringValue) {
      return color
    }
    throw Conversions.ConvertingException<Color>(value)
  }

  private static func colorFromName(_ name: String) -> Color? {
    switch name {
    case "primary":
      return .primary
    case "secondary":
      return .secondary
    case "red":
      return .red
    case "orange":
      return .orange
    case "yellow":
      return .yellow
    case "green":
      return .green
    case "blue":
      return .blue
    case "purple":
      return .purple
    case "pink":
      return .pink
    case "white":
      return .white
    case "gray":
      return .gray
    case "black":
      return .black
    case "clear":
      return .clear
    case "mint":
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        return .mint
      }
      return nil
    case "teal":
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        return .teal
      }
      return nil
    case "cyan":
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        return .cyan
      }
      return nil
    case "indigo":
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        return .indigo
      }
      return nil
    case "brown":
      if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
        return .brown
      }
      return nil
    default:
      return nil
    }
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
