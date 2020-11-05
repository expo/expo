//
//  KeyframeExtensions.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/14/19.
//

import Foundation
import CoreGraphics

extension Keyframe {
  
  /// Interpolates the keyTime into a value from 0-1
  func interpolatedProgress(_ to: Keyframe, keyTime: CGFloat) -> CGFloat {
    let startTime = time
    let endTime = to.time
    if keyTime <= startTime {
      return 0
    }
    if endTime <= keyTime {
      return 1
    }
    
    if isHold {
      return 0
    }
    
    let outTanPoint = outTangent?.pointValue ?? .zero
    let inTanPoint = to.inTangent?.pointValue ?? CGPoint(x: 1, y: 1)
    var progress: CGFloat = keyTime.remap(fromLow: startTime, fromHigh: endTime, toLow: 0, toHigh: 1)
    if !outTanPoint.isZero || !inTanPoint.equalTo(CGPoint(x: 1, y: 1)) {
      /// Cubic interpolation
      progress = progress.cubicBezierInterpolate(.zero, outTanPoint, inTanPoint, CGPoint(x: 1, y: 1))
    }
    return progress
  }
  
  /// Interpolates the keyframes' by a progress from 0-1
  func interpolate(_ to: Keyframe, progress: CGFloat) -> T {
    return value.interpolateTo(to.value, amount: progress, spatialOutTangent: spatialOutTangent?.pointValue, spatialInTangent: to.spatialInTangent?.pointValue)
  }
  
}
