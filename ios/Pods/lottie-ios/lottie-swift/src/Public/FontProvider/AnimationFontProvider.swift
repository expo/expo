//
//  AnimationFontProvider.swift
//  Lottie
//
//  Created by Brandon Withrow on 8/5/20.
//  Copyright © 2020 YurtvilleProds. All rights reserved.
//

import Foundation
import CoreGraphics
import CoreText

/**
 Font provider is a protocol that is used to supply fonts to `AnimationView`.
 
 */
public protocol AnimationFontProvider {
  func fontFor(family: String, size: CGFloat) -> CTFont?
}

/// Default Font provider.
public final class DefaultFontProvider: AnimationFontProvider {
  public func fontFor(family: String, size: CGFloat) -> CTFont? {
    return CTFontCreateWithName(family as CFString, size, nil)
  }
  
  public init() {}
}
