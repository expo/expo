// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import RegexBuilder
import SwiftUI

// The color types decode from a string, a number, an array of components, or a `PlatformColor` or
// `DynamicColorIOS` object, and encode as the `#rrggbbaa` string that `UIColor.string` returns. A string or a
// number is read straight from the JavaScript value. Any other value is read through `getAny()` and decoded by
// `uiColorFromAny(_:)`, which the `Convertible` conformances also call, so both paths accept the same values and
// throw the same exceptions.

extension UIColor: @retroactive JavaScriptDecodable, @retroactive JavaScriptEncodable {
  public static var decodableKinds: JavaScriptValueKinds {
    return [.string, .number, .object]
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Self
  {
    // swiftlint:disable:next force_cast
    return try colorFromJavaScriptValue(value, in: runtime) as! Self
  }

  // The parameter is `UIColor` rather than `Self` because a non-final class can't take a covariant `Self`.
  @JavaScriptActor
  public static func encode(_ value: UIColor, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try String.encode(colorToString(value), in: runtime)
  }
}

extension CGColor: @retroactive JavaScriptDecodable, @retroactive JavaScriptEncodable {
  public static var decodableKinds: JavaScriptValueKinds {
    return UIColor.decodableKinds
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Self
  {
    do {
      // swiftlint:disable:next force_cast
      return try colorFromJavaScriptValue(value, in: runtime).cgColor as! Self
    } catch _ as Conversions.ConvertingException<UIColor> {
      throw Conversions.ConvertingException<CGColor>(value.copied(in: runtime).getAny())
    }
  }

  @JavaScriptActor
  public static func encode(_ value: CGColor, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    #if os(macOS)
    // `NSColor(cgColor:)` is failable.
    guard let color = UIColor(cgColor: value) else {
      return .null()
    }
    #else
    let color = UIColor(cgColor: value)
    #endif
    return try UIColor.encode(color, in: runtime)
  }
}

extension Color: @retroactive JavaScriptDecodable, @retroactive JavaScriptEncodable {
  public static var decodableKinds: JavaScriptValueKinds {
    return UIColor.decodableKinds
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Color
  {
    // Like `swiftUIColorFromAny(_:)`, any error from the `UIColor` decode falls back to the SwiftUI color names.
    if let uiColor = try? colorFromJavaScriptValue(value, in: runtime) {
      return Color(uiColor)
    }
    if value.isString(), let color = swiftUIColorFromName(value.getString()) {
      return color
    }
    throw Conversions.ConvertingException<Color>(value.copied(in: runtime).getAny())
  }

  /// Encodes the color as a `#rrggbbaa` string. A dynamic or semantic color, such as `.primary`, is resolved to
  /// a fixed value for the current appearance.
  @JavaScriptActor
  public static func encode(_ value: Color, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try UIColor.encode(UIColor(value), in: runtime)
  }
}

extension UIColor {
  public var string: String {
    return colorToString(self)
  }
}

// MARK: - Conversions

@JavaScriptActor
private func colorFromJavaScriptValue(
  _ value: borrowing JavaScriptUnownedValue,
  in runtime: borrowing JavaScriptRuntime
) throws -> UIColor {
  if value.isString() {
    return try colorFromNameOrString(value.getString())
  }
  if value.isNumber() {
    return try colorFromNumber(value.getDouble())
  }
  return try uiColorFromAny(value.copied(in: runtime).getAny())
}

// Internal for the `Convertible` conformance, can become private when the Convertibles are removed.
internal func uiColorFromAny(_ value: Any?) throws -> UIColor {
  if let value = value as? String {
    return try colorFromNameOrString(value)
  }
  if let components = value as? [Double] {
    return try uiColorWithComponents(components)
  }
  if let value = value as? Int {
    return try colorFromArgb(UInt64(value))
  }
  if let value = value as? Double {
    return try colorFromNumber(value)
  }

  // Handle `PlatformColor` and `DynamicColorIOS`
  if let opaqueValue = value as? [String: Any] {
    if let semanticName = opaqueValue["semantic"] as? String,
      let color = resolveNamedColor(name: semanticName)
    {
      return color
    }
    if let semanticArray = opaqueValue["semantic"] as? [String] {
      for semanticName in semanticArray {
        if let color = resolveNamedColor(name: semanticName) {
          return color
        }
      }
    }
    if let appearances = opaqueValue["dynamic"] as? [String: Any],
      let lightColor = try appearances["light"].map({ try uiColorFromAny($0) }),
      let darkColor = try appearances["dark"].map({ try uiColorFromAny($0) })
    {
      let highContrastLightColor = try appearances["highContrastLight"].map({ try uiColorFromAny($0) })
      let highContrastDarkColor = try appearances["highContrastDark"].map({ try uiColorFromAny($0) })

      #if os(iOS) || os(tvOS)
      return UIColor { (traitCollection: UITraitCollection) -> UIColor in
        if traitCollection.userInterfaceStyle == .dark {
          if traitCollection.accessibilityContrast == .high, let highContrastDarkColor {
            return highContrastDarkColor
          }
          return darkColor
        }

        if traitCollection.accessibilityContrast == .high, let highContrastLightColor {
          return highContrastLightColor
        }
        return lightColor
      }
      #elseif os(macOS)
      return NSColor(name: nil) { (appearance: NSAppearance) -> NSColor in
        let isDarkMode = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        let isHighContrast = NSWorkspace.shared.accessibilityDisplayShouldIncreaseContrast

        if isDarkMode {
          if isHighContrast, let highContrastDarkColor = highContrastDarkColor {
            return highContrastDarkColor
          }
          return darkColor
        }

        if isHighContrast, let highContrastLightColor = highContrastLightColor {
          return highContrastLightColor
        }
        return lightColor
      }
      #endif
    }
  }
  if let color = value as? UIColor {
    return color
  }
  throw Conversions.ConvertingException<UIColor>(value)
}

// Internal for the `Convertible` conformance, can become private when the Convertibles are removed.
internal func cgColorFromAny(_ value: Any?) throws -> CGColor {
  do {
    return try uiColorFromAny(value).cgColor
  } catch _ as Conversions.ConvertingException<UIColor> {
    // Rethrow `ConvertingError` with proper type
    throw Conversions.ConvertingException<CGColor>(value)
  }
}

// Internal for the `Convertible` conformance, can become private when the Convertibles are removed.
internal func swiftUIColorFromAny(_ value: Any?) throws -> Color {
  if let uiColor = try? uiColorFromAny(value) {
    return Color(uiColor)
  }
  // Context-dependent colors
  if let stringValue = value as? String, let color = swiftUIColorFromName(stringValue) {
    return color
  }
  throw Conversions.ConvertingException<Color>(value)
}

private func swiftUIColorFromName(_ name: String) -> Color? {
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

private func colorFromNameOrString(_ value: String) throws -> UIColor {
  if let namedColorComponents = namedColors[value] {
    return try uiColorWithComponents(namedColorComponents)
  }
  return try colorFromString(value)
}

private func colorFromNumber(_ value: Double) throws -> UIColor {
  return try colorFromArgb(UInt64(value))
}

private func colorToString(_ color: UIColor) -> String {
  var r: CGFloat = 0
  var g: CGFloat = 0
  var b: CGFloat = 0
  var a: CGFloat = 0

  #if os(macOS)
  // `getRed` raises for a color that isn't in an RGB color space, such as a catalog or dynamic color.
  guard let rgbColor = color.usingColorSpace(.sRGB) else {
    return "#00000000"
  }
  rgbColor.getRed(&r, green: &g, blue: &b, alpha: &a)
  return String(
    format: "#%02x%02x%02x%02x",
    Int((r * 255).rounded()),
    Int((g * 255).rounded()),
    Int((b * 255).rounded()),
    Int((a * 255).rounded())
  )
  #else
  if color.getRed(&r, green: &g, blue: &b, alpha: &a) {
    return String(
      format: "#%02x%02x%02x%02x",
      Int((r * 255).rounded()),
      Int((g * 255).rounded()),
      Int((b * 255).rounded()),
      Int((a * 255).rounded())
    )
  }
  return "#00000000"
  #endif
}

// MARK: - Platform Color Helpers

private func resolveNamedColor(name: String) -> UIColor? {
  return UIColor(named: name) ?? uiColorFromSemanticName(name: name)
}

private func uiColorFromSemanticName(name: String) -> UIColor? {
  let selector: Selector
  if name.hasSuffix("Color") {
    selector = Selector(name)
  } else {
    selector = Selector("\(name)Color")
  }
  guard UIColor.responds(to: selector) else {
    return nil
  }

  return UIColor.perform(selector).takeUnretainedValue() as? UIColor
}

private func uiColorWithComponents(_ components: [Double]) throws -> UIColor {
  guard components.count >= 3 else {
    throw InvalidColorComponentsException(components.count)
  }
  let alpha = components.count > 3 ? components[3] : 1.0
  return UIColor(red: components[0], green: components[1], blue: components[2], alpha: alpha)
}

// MARK: - Color String Parsing

/// Parses a color string (hex, rgb, hsl, hwb) into a UIColor.
private func colorFromString(_ value: String) throws -> UIColor {
  let input = value.trimmingCharacters(in: .whitespacesAndNewlines)
  let lowercased = input.lowercased()

  if lowercased.hasPrefix("rgb") {
    return try colorFromRGBString(lowercased)
  }
  if lowercased.hasPrefix("hsl") {
    return try colorFromHSLString(lowercased)
  }
  if lowercased.hasPrefix("hwb") {
    return try colorFromHWBString(lowercased)
  }

  var hexStr = input.replacingOccurrences(of: "#", with: "")

  if hexStr.count == 6 { hexStr += "FF" }
  if hexStr.count == 3 { hexStr += "F" }

  // Expand short form (supported by Web)
  if hexStr.count == 4 {
    let chars = Array(hexStr)
    hexStr = [
      String(repeating: chars[0], count: 2),
      String(repeating: chars[1], count: 2),
      String(repeating: chars[2], count: 2),
      String(repeating: chars[3], count: 2),
    ].joined(separator: "")
  }

  var rgba: UInt64 = 0

  guard hexStr.range(of: #"^[0-9a-fA-F]{8}$"#, options: .regularExpression) != nil,
    Scanner(string: hexStr).scanHexInt64(&rgba)
  else {
    throw InvalidHexColorException(input)
  }
  return try colorFromRgba(rgba)
}

private func colorFromArgb(_ argb: UInt64) throws -> UIColor {
  guard argb <= UInt32.max else {
    throw HexColorOverflowException(argb)
  }
  let alpha = CGFloat((argb >> 24) & 0xff) / 255.0
  let red = CGFloat((argb >> 16) & 0xff) / 255.0
  let green = CGFloat((argb >> 8) & 0xff) / 255.0
  let blue = CGFloat(argb & 0xff) / 255.0
  return UIColor(red: red, green: green, blue: blue, alpha: alpha)
}

private func colorFromRgba(_ rgba: UInt64) throws -> UIColor {
  guard rgba <= UInt32.max else {
    throw HexColorOverflowException(rgba)
  }
  let red = CGFloat((rgba >> 24) & 0xff) / 255.0
  let green = CGFloat((rgba >> 16) & 0xff) / 255.0
  let blue = CGFloat((rgba >> 8) & 0xff) / 255.0
  let alpha = CGFloat(rgba & 0xff) / 255.0
  return UIColor(red: red, green: green, blue: blue, alpha: alpha)
}

// MARK: - CSS Color Function Regex Patterns

// These are built from RegexBuilder primitives only. Composing regex-literal fragments
// (e.g. /hsla?\(\s*/) inside a builder miscompiles on some OS runtime versions
// (observed on the iOS 27.0 beta simulator) and the patterns silently stop matching.

/// A CSS number like `-12`, `+1.5`, `.5` or `100`.
nonisolated(unsafe) private let cssNumber = Regex {
  Optionally {
    CharacterClass.anyOf("-+")
  }
  ZeroOrMore(.digit)
  Optionally {
    "."
  }
  OneOrMore(.digit)
}

nonisolated(unsafe) private let cssNumberOrPercent = Regex {
  cssNumber
  Optionally {
    "%"
  }
}

nonisolated(unsafe) private let commaSeparator = Regex {
  ZeroOrMore(.whitespace)
  ","
  ZeroOrMore(.whitespace)
}

nonisolated(unsafe) private let rgbCommaRegex = Regex {
  "rgb"
  Optionally {
    "a"
  }
  "("
  ZeroOrMore(.whitespace)
  Capture {
    cssNumberOrPercent
  }
  commaSeparator
  Capture {
    cssNumberOrPercent
  }
  commaSeparator
  Capture {
    cssNumberOrPercent
  }
  Optionally {
    commaSeparator
    Capture {
      cssNumberOrPercent
    }
  }
  ZeroOrMore(.whitespace)
  ")"
}.ignoresCase()

nonisolated(unsafe) private let rgbSpaceRegex = Regex {
  "rgb"
  Optionally {
    "a"
  }
  "("
  ZeroOrMore(.whitespace)
  Capture {
    cssNumberOrPercent
  }
  OneOrMore(.whitespace)
  Capture {
    cssNumberOrPercent
  }
  OneOrMore(.whitespace)
  Capture {
    cssNumberOrPercent
  }
  Optionally {
    ZeroOrMore(.whitespace)
    "/"
    ZeroOrMore(.whitespace)
    Capture {
      cssNumberOrPercent
    }
  }
  ZeroOrMore(.whitespace)
  ")"
}.ignoresCase()

nonisolated(unsafe) private let hslCommaRegex = Regex {
  "hsl"
  Optionally {
    "a"
  }
  "("
  ZeroOrMore(.whitespace)
  Capture {
    cssNumber
  }
  commaSeparator
  Capture {
    cssNumber
  }
  "%"
  commaSeparator
  Capture {
    cssNumber
  }
  "%"
  ZeroOrMore(.whitespace)
  Optionally {
    ","
    ZeroOrMore(.whitespace)
    Capture {
      cssNumberOrPercent
    }
  }
  ZeroOrMore(.whitespace)
  ")"
}.ignoresCase()

nonisolated(unsafe) private let hslSpaceRegex = Regex {
  "hsl"
  Optionally {
    "a"
  }
  "("
  ZeroOrMore(.whitespace)
  Capture {
    cssNumber
  }
  OneOrMore(.whitespace)
  Capture {
    cssNumber
  }
  "%"
  OneOrMore(.whitespace)
  Capture {
    cssNumber
  }
  "%"
  ZeroOrMore(.whitespace)
  Optionally {
    "/"
    ZeroOrMore(.whitespace)
    Capture {
      cssNumberOrPercent
    }
  }
  ZeroOrMore(.whitespace)
  ")"
}.ignoresCase()

nonisolated(unsafe) private let hwbRegex = Regex {
  "hwb("
  ZeroOrMore(.whitespace)
  Capture {
    cssNumber
  }
  OneOrMore(.whitespace)
  Capture {
    cssNumber
  }
  "%"
  OneOrMore(.whitespace)
  Capture {
    cssNumber
  }
  "%"
  ZeroOrMore(.whitespace)
  Optionally {
    "/"
    ZeroOrMore(.whitespace)
    Capture {
      cssNumberOrPercent
    }
  }
  ZeroOrMore(.whitespace)
  ")"
}.ignoresCase()

// MARK: - CSS Color Function Parsers

private func parseRgbComponent(_ value: Substring) -> CGFloat {
  if value.hasSuffix("%") {
    let num = Double(value.dropLast()) ?? 0
    return CGFloat(min(max(num / 100.0, 0), 1))
  }
  let num = Double(value) ?? 0
  return CGFloat(min(max(num / 255.0, 0), 1))
}

private func parseCssAlpha(_ value: Substring?) -> CGFloat {
  guard let value else {
    return 1.0
  }
  if value.hasSuffix("%") {
    let num = Double(value.dropLast()) ?? 0
    return CGFloat(min(max(num / 100.0, 0), 1))
  }
  let num = Double(value) ?? 0
  return CGFloat(min(max(num, 0), 1))
}

private func hueToRgb(_ p: CGFloat, _ q: CGFloat, _ t: CGFloat) -> CGFloat {
  var t = t
  if t < 0 { t += 1 }
  if t > 1 { t -= 1 }
  if t < 1.0 / 6.0 { return p + (q - p) * 6.0 * t }
  if t < 1.0 / 2.0 { return q }
  if t < 2.0 / 3.0 { return p + (q - p) * (2.0 / 3.0 - t) * 6.0 }
  return p
}

private func hslToUIColor(h: CGFloat, s: CGFloat, l: CGFloat, a: CGFloat) -> UIColor {
  let hue =
    ((h.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)) / 360.0
  let r: CGFloat
  let g: CGFloat
  let b: CGFloat
  if s == 0 {
    r = l
    g = l
    b = l
  } else {
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s
    let p = 2 * l - q
    r = hueToRgb(p, q, hue + 1.0 / 3.0)
    g = hueToRgb(p, q, hue)
    b = hueToRgb(p, q, hue - 1.0 / 3.0)
  }
  return UIColor(
    red: min(max(r, 0), 1),
    green: min(max(g, 0), 1),
    blue: min(max(b, 0), 1),
    alpha: a
  )
}

private func hwbToUIColor(h: CGFloat, w: CGFloat, b: CGFloat, a: CGFloat) -> UIColor {
  let ww = min(max(w, 0), 1 as CGFloat)
  let bb = min(max(b, 0), 1 as CGFloat)
  let sum = ww + bb
  let white = sum > 1 ? ww / sum : ww
  let black = sum > 1 ? bb / sum : bb
  let hue =
    ((h.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)) / 360.0
  let r = hueToRgb(0, 1, hue + 1.0 / 3.0) * (1 - white - black) + white
  let g = hueToRgb(0, 1, hue) * (1 - white - black) + white
  let bl = hueToRgb(0, 1, hue - 1.0 / 3.0) * (1 - white - black) + white
  return UIColor(
    red: min(max(r, 0), 1),
    green: min(max(g, 0), 1),
    blue: min(max(bl, 0), 1),
    alpha: a
  )
}

private func colorFromRGBString(_ rgbString: String) throws -> UIColor {
  if let match = rgbString.wholeMatch(of: rgbCommaRegex) ?? rgbString.wholeMatch(of: rgbSpaceRegex) {
    let r = parseRgbComponent(match.1)
    let g = parseRgbComponent(match.2)
    let b = parseRgbComponent(match.3)
    let a = parseCssAlpha(match.4)
    return UIColor(red: r, green: g, blue: b, alpha: a)
  }
  throw InvalidRGBColorException(rgbString)
}

private func colorFromHSLString(_ hslString: String) throws -> UIColor {
  if let match = hslString.wholeMatch(of: hslCommaRegex) ?? hslString.wholeMatch(of: hslSpaceRegex) {
    let h = CGFloat(Double(match.1) ?? 0)
    let s = CGFloat(min(max((Double(match.2) ?? 0) / 100.0, 0), 1))
    let l = CGFloat(min(max((Double(match.3) ?? 0) / 100.0, 0), 1))
    let a = parseCssAlpha(match.4)
    return hslToUIColor(h: h, s: s, l: l, a: a)
  }
  throw InvalidHSLColorException(hslString)
}

private func colorFromHWBString(_ hwbString: String) throws -> UIColor {
  if let match = hwbString.wholeMatch(of: hwbRegex) {
    let h = CGFloat(Double(match.1) ?? 0)
    let w = CGFloat((Double(match.2) ?? 0) / 100.0)
    let b = CGFloat((Double(match.3) ?? 0) / 100.0)
    let a = parseCssAlpha(match.4)
    return hwbToUIColor(h: h, w: w, b: b, a: a)
  }
  throw InvalidHWBColorException(hwbString)
}

/// Color components for named colors following the [CSS3/SVG specification](https://www.w3.org/TR/css-color-3/#svg-color)
/// and additionally the transparent color.
private let namedColors: [String: [Double]] = [
  "aliceblue": [240, 248, 255, 255],
  "antiquewhite": [250, 235, 215, 255],
  "aqua": [0, 255, 255, 255],
  "aquamarine": [127, 255, 212, 255],
  "azure": [240, 255, 255, 255],
  "beige": [245, 245, 220, 255],
  "bisque": [255, 228, 196, 255],
  "black": [0, 0, 0, 255],
  "blanchedalmond": [255, 235, 205, 255],
  "blue": [0, 0, 255, 255],
  "blueviolet": [138, 43, 226, 255],
  "brown": [165, 42, 42, 255],
  "burlywood": [222, 184, 135, 255],
  "cadetblue": [95, 158, 160, 255],
  "chartreuse": [127, 255, 0, 255],
  "chocolate": [210, 105, 30, 255],
  "coral": [255, 127, 80, 255],
  "cornflowerblue": [100, 149, 237, 255],
  "cornsilk": [255, 248, 220, 255],
  "crimson": [220, 20, 60, 255],
  "cyan": [0, 255, 255, 255],
  "darkblue": [0, 0, 139, 255],
  "darkcyan": [0, 139, 139, 255],
  "darkgoldenrod": [184, 134, 11, 255],
  "darkgray": [169, 169, 169, 255],
  "darkgreen": [0, 100, 0, 255],
  "darkgrey": [169, 169, 169, 255],
  "darkkhaki": [189, 183, 107, 255],
  "darkmagenta": [139, 0, 139, 255],
  "darkolivegreen": [85, 107, 47, 255],
  "darkorange": [255, 140, 0, 255],
  "darkorchid": [153, 50, 204, 255],
  "darkred": [139, 0, 0, 255],
  "darksalmon": [233, 150, 122, 255],
  "darkseagreen": [143, 188, 143, 255],
  "darkslateblue": [72, 61, 139, 255],
  "darkslategray": [47, 79, 79, 255],
  "darkslategrey": [47, 79, 79, 255],
  "darkturquoise": [0, 206, 209, 255],
  "darkviolet": [148, 0, 211, 255],
  "deeppink": [255, 20, 147, 255],
  "deepskyblue": [0, 191, 255, 255],
  "dimgray": [105, 105, 105, 255],
  "dimgrey": [105, 105, 105, 255],
  "dodgerblue": [30, 144, 255, 255],
  "firebrick": [178, 34, 34, 255],
  "floralwhite": [255, 250, 240, 255],
  "forestgreen": [34, 139, 34, 255],
  "fuchsia": [255, 0, 255, 255],
  "gainsboro": [220, 220, 220, 255],
  "ghostwhite": [248, 248, 255, 255],
  "gold": [255, 215, 0, 255],
  "goldenrod": [218, 165, 32, 255],
  "gray": [128, 128, 128, 255],
  "green": [0, 128, 0, 255],
  "greenyellow": [173, 255, 47, 255],
  "grey": [128, 128, 128, 255],
  "honeydew": [240, 255, 240, 255],
  "hotpink": [255, 105, 180, 255],
  "indianred": [205, 92, 92, 255],
  "indigo": [75, 0, 130, 255],
  "ivory": [255, 255, 240, 255],
  "khaki": [240, 230, 140, 255],
  "lavender": [230, 230, 250, 255],
  "lavenderblush": [255, 240, 245, 255],
  "lawngreen": [124, 252, 0, 255],
  "lemonchiffon": [255, 250, 205, 255],
  "lightblue": [173, 216, 230, 255],
  "lightcoral": [240, 128, 128, 255],
  "lightcyan": [224, 255, 255, 255],
  "lightgoldenrodyellow": [250, 250, 210, 255],
  "lightgray": [211, 211, 211, 255],
  "lightgreen": [144, 238, 144, 255],
  "lightgrey": [211, 211, 211, 255],
  "lightpink": [255, 182, 193, 255],
  "lightsalmon": [255, 160, 122, 255],
  "lightseagreen": [32, 178, 170, 255],
  "lightskyblue": [135, 206, 250, 255],
  "lightslategray": [119, 136, 153, 255],
  "lightslategrey": [119, 136, 153, 255],
  "lightsteelblue": [176, 196, 222, 255],
  "lightyellow": [255, 255, 224, 255],
  "lime": [0, 255, 0, 255],
  "limegreen": [50, 205, 50, 255],
  "linen": [250, 240, 230, 255],
  "magenta": [255, 0, 255, 255],
  "maroon": [128, 0, 0, 255],
  "mediumaquamarine": [102, 205, 170, 255],
  "mediumblue": [0, 0, 205, 255],
  "mediumorchid": [186, 85, 211, 255],
  "mediumpurple": [147, 112, 219, 255],
  "mediumseagreen": [60, 179, 113, 255],
  "mediumslateblue": [123, 104, 238, 255],
  "mediumspringgreen": [0, 250, 154, 255],
  "mediumturquoise": [72, 209, 204, 255],
  "mediumvioletred": [199, 21, 133, 255],
  "midnightblue": [25, 25, 112, 255],
  "mintcream": [245, 255, 250, 255],
  "mistyrose": [255, 228, 225, 255],
  "moccasin": [255, 228, 181, 255],
  "navajowhite": [255, 222, 173, 255],
  "navy": [0, 0, 128, 255],
  "oldlace": [253, 245, 230, 255],
  "olive": [128, 128, 0, 255],
  "olivedrab": [107, 142, 35, 255],
  "orange": [255, 165, 0, 255],
  "orangered": [255, 69, 0, 255],
  "orchid": [218, 112, 214, 255],
  "palegoldenrod": [238, 232, 170, 255],
  "palegreen": [152, 251, 152, 255],
  "paleturquoise": [175, 238, 238, 255],
  "palevioletred": [219, 112, 147, 255],
  "papayawhip": [255, 239, 213, 255],
  "peachpuff": [255, 218, 185, 255],
  "peru": [205, 133, 63, 255],
  "pink": [255, 192, 203, 255],
  "plum": [221, 160, 221, 255],
  "powderblue": [176, 224, 230, 255],
  "purple": [128, 0, 128, 255],
  "rebeccapurple": [102, 51, 153, 255],
  "red": [255, 0, 0, 255],
  "rosybrown": [188, 143, 143, 255],
  "royalblue": [65, 105, 225, 255],
  "saddlebrown": [139, 69, 19, 255],
  "salmon": [250, 128, 114, 255],
  "sandybrown": [244, 164, 96, 255],
  "seagreen": [46, 139, 87, 255],
  "seashell": [255, 245, 238, 255],
  "sienna": [160, 82, 45, 255],
  "silver": [192, 192, 192, 255],
  "skyblue": [135, 206, 235, 255],
  "slateblue": [106, 90, 205, 255],
  "slategray": [112, 128, 144, 255],
  "slategrey": [112, 128, 144, 255],
  "snow": [255, 250, 250, 255],
  "springgreen": [0, 255, 127, 255],
  "steelblue": [70, 130, 180, 255],
  "tan": [210, 180, 140, 255],
  "teal": [0, 128, 128, 255],
  "thistle": [216, 191, 216, 255],
  "tomato": [255, 99, 71, 255],
  "transparent": [0, 0, 0, 0],
  "turquoise": [64, 224, 208, 255],
  "violet": [238, 130, 238, 255],
  "wheat": [245, 222, 179, 255],
  "white": [255, 255, 255, 255],
  "whitesmoke": [245, 245, 245, 255],
  "yellow": [255, 255, 0, 255],
  "yellowgreen": [154, 205, 50, 255],
].mapValues { $0.map { $0 / 255.0 } }

// MARK: - Color Conversion Exceptions

internal class InvalidHexColorException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Provided hex color '\(param)' is invalid"
  }
}

internal class InvalidRGBColorException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Provided rgb color string '\(param)' is invalid"
  }
}

internal class InvalidHSLColorException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Provided hsl color string '\(param)' is invalid"
  }
}

internal class InvalidHWBColorException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Provided hwb color string '\(param)' is invalid"
  }
}

internal class HexColorOverflowException: GenericException<UInt64>, @unchecked Sendable {
  override var reason: String {
    "Provided hex color '\(param)' would result in an overflow"
  }
}

internal class InvalidColorComponentsException: GenericException<Int>, @unchecked Sendable {
  override var reason: String {
    "Color components array must contain at least 3 values (red, green, blue), but got \(param)"
  }
}
