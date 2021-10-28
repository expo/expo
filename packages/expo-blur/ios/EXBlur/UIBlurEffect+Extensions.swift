// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

extension UIBlurEffect {
  convenience init(tint: String) {
    self.init(style: UIBlurEffect.blurEffectStyleFrom(tint))
  }

  private static func blurEffectStyleFrom(_ tint: String) -> UIBlurEffect.Style {
    switch (tint) {
    case "light": return .light
    case "dark": return .dark
    case "default": return .light
    default: return .dark
    }
  }
}
