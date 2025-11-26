import UIKit

internal class FontUtils {
  static func createFont(fontFamily: String?, fontSize: Double?, fontWeight: String?)
    -> UIFont
  {
    return FontUtilsObjC.createFont(
      fontFamily, fontSize: fontSize.map { NSNumber(value: $0) }, fontWeight: fontWeight)
  }
}
