//
//  UIColorExtension.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation
#if os(iOS) || os(tvOS) || os(watchOS)
import UIKit

public extension UIColor {
  
  var lottieColorValue: Color {
    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
    getRed(&r, green: &g, blue: &b, alpha: &a)
    return Color(r: Double(r), g: Double(g), b: Double(b), a: Double(a))
  }
  
}
#endif
