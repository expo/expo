//
//  AnimationSubview.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation
#if os(iOS) || os(tvOS) || os(watchOS)
import UIKit

/// A view that can be added to a keypath of an AnimationView
public final class AnimationSubview: UIView {
  
  var viewLayer: CALayer? {
    return layer
  }
  
}
#endif
