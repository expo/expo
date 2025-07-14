// Copyright 2022-present 650 Industries. All rights reserved.

extension UIColor: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    // swiftlint:disable force_cast
    if let value = value as? String {
      if let namedColorComponents = namedColors[value] {
        return uiColorWithComponents(namedColorComponents.map { $0 / 255 }) as! Self
      }
      return try Conversions.toColor(colorString: value) as! Self
    }
    if let components = value as? [Double] {
      return uiColorWithComponents(components) as! Self
    }
    if let value = value as? Int {
      return try Conversions.toColor(argb: UInt64(value)) as! Self
    }

    // Handle `PlatformColor` and `DynamicColorIOS`
    if let opaqueValue = value as? [String: Any] {
      if let semanticName = opaqueValue["semantic"] as? String,
        let color = resolveNamedColor(name: semanticName) {
        return color as! Self
      }
      if let semanticArray = opaqueValue["semantic"] as? [String] {
        for semanticName in semanticArray {
          if let color = resolveNamedColor(name: semanticName) {
            return color as! Self
          }
        }
      }
      if let appearances = opaqueValue["dynamic"] as? [String: Any],
        let lightColor = try appearances["light"].map({ try UIColor.convert(from: $0, appContext: appContext) }),
        let darkColor = try appearances["dark"].map({ try UIColor.convert(from: $0, appContext: appContext) }) {
        let highContrastLightColor = try appearances["highContrastLight"].map({ try UIColor.convert(from: $0, appContext: appContext) })
        let highContrastDarkColor = try appearances["highContrastDark"].map({ try UIColor.convert(from: $0, appContext: appContext) })

        #if os(iOS) || os(tvOS)
        let color = UIColor { (traitCollection: UITraitCollection) -> UIColor in
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
        let color = NSColor(name: nil) { (appearance: NSAppearance) -> NSColor in
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
        return color as! Self
      }
    }
    if let color = value as? Self {
      return color
    }
    throw Conversions.ConvertingException<UIColor>(value)
    // swiftlint:enable force_cast
  }
}

extension CGColor: Convertible {
  public static func convert(from value: Any?, appContext: AppContext) throws -> Self {
    // swiftlint:disable force_cast
    do {
      return try UIColor.convert(from: value, appContext: appContext).cgColor as! Self
    } catch _ as Conversions.ConvertingException<UIColor> {
      // Rethrow `ConvertingError` with proper type
      throw Conversions.ConvertingException<CGColor>(value)
    }
    // swiftlint:enable force_cast
  }
}

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

private func uiColorWithComponents(_ components: [Double]) -> UIColor {
  let alpha = components.count > 3 ? components[3] : 1.0
  return UIColor(red: components[0], green: components[1], blue: components[2], alpha: alpha)
}

/**
 Color components for named colors following the [CSS3/SVG specification](https://www.w3.org/TR/css-color-3/#svg-color)
 and additionally the transparent color.
 */
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
  "yellowgreen": [154, 205, 50, 255]
]
