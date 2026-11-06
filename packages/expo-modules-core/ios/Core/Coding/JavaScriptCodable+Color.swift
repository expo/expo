// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import SwiftUI

// The color types decode through their `Convertible` conversions, so they accept the same values and throw
// the same exceptions. Those conversions read a type-erased value, which `getAny()` creates. Every color
// encodes as the `#rrggbbaa` string that `UIColor.string` returns.

extension UIColor: JavaScriptDecodable, JavaScriptEncodable {
  // A color decodes from a string, a number, an array of components, or a `PlatformColor` or
  // `DynamicColorIOS` object.
  public static var decodableKinds: JavaScriptValueKinds {
    return [.string, .number, .object]
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self {
    return try convert(from: value.getAny())
  }

  // The parameter is `UIColor` rather than `Self` because a non-final class can't take a covariant `Self`.
  @JavaScriptActor
  public static func encode(_ value: UIColor, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try String.encode(value.string, in: runtime)
  }
}

extension CGColor: JavaScriptDecodable, JavaScriptEncodable {
  public static var decodableKinds: JavaScriptValueKinds {
    return UIColor.decodableKinds
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self {
    return try convert(from: value.getAny())
  }

  @JavaScriptActor
  public static func encode(_ value: CGColor, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    // `NSColor(cgColor:)` is failable on macOS.
    guard let color = Optional(UIColor(cgColor: value)) else {
      return .null()
    }
    return try UIColor.encode(color, in: runtime)
  }
}

extension Color: JavaScriptDecodable, JavaScriptEncodable {
  public static var decodableKinds: JavaScriptValueKinds {
    return UIColor.decodableKinds
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Color {
    return try convert(from: value.getAny())
  }

  @JavaScriptActor
  public static func encode(_ value: Color, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try UIColor.encode(UIColor(value), in: runtime)
  }
}
