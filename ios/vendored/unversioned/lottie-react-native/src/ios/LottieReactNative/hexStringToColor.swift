//
//  hexStringToColor.swift
//  LottieReactNative
//
//  Created by Igor Mandrigin on 2020-08-28.
//  Copyright © 2020 Airbnb. All rights reserved.
//
import Lottie

#if os(OSX)

import AppKit

typealias PlatformColor = NSColor

// NSColor doesn't have this extension (UIColor receives it from Lottie), so we add it here
public extension NSColor {
    var lottieColorValue: Color {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        getRed(&r, green: &g, blue: &b, alpha: &a)
        return Color(r: Double(r), g: Double(g), b: Double(b), a: Double(a))
    }
}

#else

import UIKit

typealias PlatformColor = UIColor

#endif

func hexStringToColor(hex: String) -> Color {
    var cString:String = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

    if (cString.hasPrefix("#")) {
        cString.remove(at: cString.startIndex)
    }

    if ((cString.count) == 0) {
        return PlatformColor.red.lottieColorValue
    }

    if ((cString.count) != 6) {
        return PlatformColor.green.lottieColorValue
    }

    var rgbValue:UInt32 = 0
    Scanner(string: cString).scanHexInt32(&rgbValue)

    return PlatformColor(red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
                         green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
                         blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
                         alpha:CGFloat(1.0)).lottieColorValue;
}



