import React
import UIKit

struct RouterFontUtils {
  static func convertTitleStyleToFont(_ titleStyle: TitleStyle) -> UIFont {
    let fontFamily = titleStyle.fontFamily
    let fontWeight = titleStyle.fontWeight

    let resolvedFontSize = resolveFontSize(titleStyle.fontSize)

    if fontFamily != nil || fontWeight != nil {
      return RCTFont.update(
        nil,
        withFamily: fontFamily,
        size: NSNumber(value: Float(resolvedFontSize)),
        weight: fontWeight,
        style: nil,
        variant: nil,
        scaleMultiplier: 1.0)
    }
    return UIFont.systemFont(ofSize: resolvedFontSize)
  }

  static func setTitleStyle(fromConfig titleStyle: TitleStyle, for item: UIBarButtonItem) {
    var attrs: [NSAttributedString.Key: Any] = [:]

    attrs[.font] = convertTitleStyleToFont(titleStyle)

    if let color = titleStyle.color {
      attrs[.foregroundColor] = color
    }

    item.setTitleTextAttributes(attrs, for: .normal)
    item.setTitleTextAttributes(attrs, for: .highlighted)
    item.setTitleTextAttributes(attrs, for: .disabled)
    item.setTitleTextAttributes(attrs, for: .selected)
    item.setTitleTextAttributes(attrs, for: .focused)
  }

  static func clearTitleStyle(for item: UIBarButtonItem) {
    item.setTitleTextAttributes(nil, for: .normal)
    item.setTitleTextAttributes(nil, for: .highlighted)
    item.setTitleTextAttributes(nil, for: .disabled)
    item.setTitleTextAttributes(nil, for: .selected)
    item.setTitleTextAttributes(nil, for: .focused)
  }

  private static func resolveFontSize(_ fontSize: Double?) -> CGFloat {
    if let fontSize = fontSize {
      return CGFloat(fontSize)
    }
    #if os(tvOS)
      return 17.0
    #else
      return UIFont.labelFontSize
    #endif
  }
}
