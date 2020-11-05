//
//  AnimatedButton.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation
#if os(iOS) || os(tvOS) || os(watchOS)
import UIKit
/**
 An interactive button that plays an animation when pressed.
 */
final public class AnimatedButton: AnimatedControl {
  
  /// Sets the play range for the given UIControlEvent.
  public func setPlayRange(fromProgress: AnimationProgressTime, toProgress: AnimationProgressTime, event: UIControl.Event) {
    rangesForEvents[event.rawValue] = (from: fromProgress, to: toProgress)
  }
  
  /// Sets the play range for the given UIControlEvent.
  public func setPlayRange(fromMarker fromName: String, toMarker toName: String, event: UIControl.Event) {
    if let start = animationView.progressTime(forMarker: fromName),
      let end = animationView.progressTime(forMarker: toName) {
      rangesForEvents[event.rawValue] = (from: start, to: end)
    }
  }
  
  public override init(animation: Animation) {
    super.init(animation: animation)
    self.accessibilityTraits = UIAccessibilityTraits.button
  }
  
  public override init() {
    super.init()
    self.accessibilityTraits = UIAccessibilityTraits.button
  }

  fileprivate var rangesForEvents: [UInt : (from: CGFloat, to: CGFloat)] = [UIControl.Event.touchUpInside.rawValue : (from: 0, to: 1)]
  
  required public init?(coder aDecoder: NSCoder) {
    super.init(coder: aDecoder)
  }
  
  public override func beginTracking(_ touch: UITouch, with event: UIEvent?) -> Bool {
    let _ = super.beginTracking(touch, with: event)
    let touchEvent = UIControl.Event.touchDown
    if let playrange = rangesForEvents[touchEvent.rawValue] {
      animationView.play(fromProgress: playrange.from, toProgress: playrange.to, loopMode: LottieLoopMode.playOnce)
    }
    return true
  }
  
  public override func endTracking(_ touch: UITouch?, with event: UIEvent?) {
    super.endTracking(touch, with: event)
    let touchEvent: UIControl.Event
    if let touch = touch, bounds.contains(touch.location(in: self)) {
      touchEvent = UIControl.Event.touchUpInside
    } else {
      touchEvent = UIControl.Event.touchUpOutside
    }
    
    if let playrange = rangesForEvents[touchEvent.rawValue] {
      animationView.play(fromProgress: playrange.from, toProgress: playrange.to, loopMode: LottieLoopMode.playOnce)
    }
  }
}
#endif
