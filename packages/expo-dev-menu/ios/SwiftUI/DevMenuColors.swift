import SwiftUI
import ExpoModulesCore

#if os(macOS)
import AppKit
#else
import UIKit
#endif

struct DevMenuColors {
  let colorScheme: ColorScheme

  // Tip colors (blue.11 and blue.3)
  var tipBlue: Color {
#if os(macOS)
    let darkColor = NSColor(displayP3Red: 0.49, green: 0.72, blue: 1.0, alpha: 1.0)
    let lightColor = NSColor(displayP3Red: 0.15, green: 0.44, blue: 0.84, alpha: 1.0)
#else
    let darkColor = UIColor(displayP3Red: 0.49, green: 0.72, blue: 1.0, alpha: 1.0)
    let lightColor = UIColor(displayP3Red: 0.15, green: 0.44, blue: 0.84, alpha: 1.0)
#endif
    return Color(colorScheme == .dark ? darkColor : lightColor)
  }

  var tipBackground: Color {
#if os(macOS)
    let darkColor = NSColor(displayP3Red: 0.078, green: 0.154, blue: 0.27, alpha: 1.0)
    let lightColor = NSColor(displayP3Red: 0.912, green: 0.956, blue: 0.991, alpha: 1.0)
#else
    let darkColor = UIColor(displayP3Red: 0.078, green: 0.154, blue: 0.27, alpha: 1.0)
    let lightColor = UIColor(displayP3Red: 0.912, green: 0.956, blue: 0.991, alpha: 1.0)
#endif
    return Color(colorScheme == .dark ? darkColor : lightColor)
  }
}
