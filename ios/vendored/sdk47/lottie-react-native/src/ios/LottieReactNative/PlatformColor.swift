//
//  PlatformColor.swift
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
