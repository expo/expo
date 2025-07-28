// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

@objc
public class EXDevLauncherManifestHelper: NSObject {
  #if !os(tvOS)
  private static func defaultOrientationForOrientationMask(_ orientationMask: UIInterfaceOrientationMask) -> UIInterfaceOrientation {
    if orientationMask.contains(.all) {
      return UIInterfaceOrientation.unknown
    }
    if orientationMask.contains(.portrait) {
      return UIInterfaceOrientation.portrait
    }
    if orientationMask.contains(.landscapeLeft) {
      return UIInterfaceOrientation.landscapeLeft
    }
    if orientationMask.contains(.landscapeRight) {
      return UIInterfaceOrientation.landscapeRight
    }
    if orientationMask.contains(.portraitUpsideDown) {
      return UIInterfaceOrientation.portraitUpsideDown
    }

    return UIInterfaceOrientation.unknown
  }

  @objc
  public static func exportManifestOrientation(_ orientation: String?) -> UIInterfaceOrientation {
    var orientationMask = UIInterfaceOrientationMask.all
    if orientation == "portrait" {
      orientationMask = .portrait
    } else if orientation == "landscape" {
      orientationMask = .landscape
    }

    return defaultOrientationForOrientationMask(orientationMask)
  }
#endif

  @objc
  public static func hexStringToColor(_ hexString: String?) -> UIColor? {
    guard var hexString = hexString else {
      return nil
    }

    if hexString.count != 7 || !hexString.starts(with: "#") {
      return nil
    }

    hexString.removeFirst()

    var rgbValue: UInt64 = 0
    Scanner(string: hexString).scanHexInt64(&rgbValue)

    return UIColor(
      red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
      green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
      blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
      alpha: 1.0
    )
  }

  @objc
  public static func exportManifestUserInterfaceStyle(_ userInterfaceStyle: String?) -> UIUserInterfaceStyle {
    switch userInterfaceStyle {
    case "light":
      return .light
    case "dark":
      return .dark
    default:
      return .unspecified
    }
  }
}
