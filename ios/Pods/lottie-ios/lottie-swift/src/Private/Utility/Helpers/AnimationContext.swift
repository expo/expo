//
//  AnimationContext.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/1/19.
//

import Foundation
import CoreGraphics
import QuartzCore

/// A completion block for animations. `true` is passed in if the animation completed playing.
public typealias LottieCompletionBlock = (Bool) -> Void

struct AnimationContext {

  init(playFrom: CGFloat,
       playTo: CGFloat,
       closure: LottieCompletionBlock?) {
    self.playTo = playTo
    self.playFrom = playFrom
    self.closure = AnimationCompletionDelegate(completionBlock: closure)
  }

  var playFrom: CGFloat
  var playTo: CGFloat
  var closure: AnimationCompletionDelegate

}

enum AnimationContextState {
  case playing
  case cancelled
  case complete
}

class AnimationCompletionDelegate: NSObject, CAAnimationDelegate {
  
  init(completionBlock: LottieCompletionBlock?) {
    self.completionBlock = completionBlock
    super.init()
  }
  
  var animationLayer: AnimationContainer?
  var animationKey: String?
  var ignoreDelegate: Bool = false
  var animationState: AnimationContextState = .playing
  
  let completionBlock: LottieCompletionBlock?
  
  public func animationDidStop(_ anim: CAAnimation, finished flag: Bool) {
    guard ignoreDelegate == false else { return }
    animationState = flag ? .complete : .cancelled
    if let animationLayer = animationLayer, let key = animationKey {
      animationLayer.removeAnimation(forKey: key)
      if flag {
        animationLayer.currentFrame = (anim as! CABasicAnimation).toValue as! CGFloat
      }
    }
    if let completionBlock = completionBlock {
      completionBlock(flag)
    }
  }
  
}
