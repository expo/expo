//
//  AnimatedSwitch.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation
#if os(iOS) || os(tvOS) || os(watchOS)
import UIKit

/**
 An interactive switch with an 'On' and 'Off' state. When the user taps on the
 switch the state is toggled and the appropriate animation is played.
 
 Both the 'On' and 'Off' have an animation play range associated with their state.
 */
final public class AnimatedSwitch: AnimatedControl {

  /// Defines what happens when the user taps the switch while an
  /// animation is still in flight
  public enum CancelBehavior {
    case reverse // default - plays the current animation in reverse
    case none    // does not update the animation when canceled
  }
  
  /// The current state of the switch.
  public var isOn: Bool {
    set {
      /// This is forwarded to a private variable because the animation needs to be updated without animation when set externally and with animation when set internally.
      guard _isOn != newValue else { return }
      updateOnState(isOn: newValue, animated: false, shouldFireHaptics: false)
    }
    get {
      return _isOn
    }
  }

  /// The cancel behavior for the switch. See CancelBehavior for options
  public var cancelBehavior: CancelBehavior = .reverse

  /// Set the state of the switch and specify animation and haptics
  public func setIsOn(_ isOn: Bool, animated: Bool, shouldFireHaptics: Bool = true) {
    guard isOn != _isOn else { return }
    updateOnState(isOn: isOn, animated: animated, shouldFireHaptics: shouldFireHaptics)
  }

  /// Sets the play range for the given state. When the switch is toggled, the animation range is played.
  public func setProgressForState(fromProgress: AnimationProgressTime,
                                  toProgress: AnimationProgressTime,
                                  forOnState: Bool) {
    if forOnState {
      onStartProgress = fromProgress
      onEndProgress = toProgress
    } else {
      offStartProgress = fromProgress
      offEndProgress = toProgress
    }
    
    updateOnState(isOn: _isOn, animated: false, shouldFireHaptics: false)
  }
  
  public override init(animation: Animation) {
    /// Generate a haptic generator if available.
    #if os(iOS)
    if #available(iOS 10.0, *) {
      self.hapticGenerator = HapticGenerator()
    } else {
      self.hapticGenerator = NullHapticGenerator()
    }
    #else
    self.hapticGenerator = NullHapticGenerator()
    #endif
    super.init(animation: animation)
    updateOnState(isOn: _isOn, animated: false, shouldFireHaptics: false)
    self.accessibilityTraits = UIAccessibilityTraits.button
  }
  
  public override init() {
    /// Generate a haptic generator if available.
    #if os(iOS)
    if #available(iOS 10.0, *) {
      self.hapticGenerator = HapticGenerator()
    } else {
      self.hapticGenerator = NullHapticGenerator()
    }
    #else
    self.hapticGenerator = NullHapticGenerator()
    #endif
    super.init()
    updateOnState(isOn: _isOn, animated: false, shouldFireHaptics: false)
    self.accessibilityTraits = UIAccessibilityTraits.button
  }
  
  required public init?(coder aDecoder: NSCoder) {
    /// Generate a haptic generator if available.
    #if os(iOS)
    if #available(iOS 10.0, *) {
      self.hapticGenerator = HapticGenerator()
    } else {
      self.hapticGenerator = NullHapticGenerator()
    }
    #else
    self.hapticGenerator = NullHapticGenerator()
    #endif
    super.init(coder: aDecoder)
    self.accessibilityTraits = UIAccessibilityTraits.button
  }
  
  fileprivate var onStartProgress: CGFloat = 0
  fileprivate var onEndProgress: CGFloat = 1
  fileprivate var offStartProgress: CGFloat = 1
  fileprivate var offEndProgress: CGFloat = 0
  fileprivate var _isOn: Bool = false
  fileprivate var hapticGenerator: ImpactGenerator
  
  // MARK: Animation State

  func updateOnState(isOn: Bool, animated: Bool, shouldFireHaptics: Bool) {
    _isOn = isOn
    var startProgress = isOn ? onStartProgress : offStartProgress
    var endProgress = isOn ? onEndProgress : offEndProgress
    let finalProgress = endProgress

    if cancelBehavior == .reverse {
      let realtimeProgress = animationView.realtimeAnimationProgress

      let previousStateStart = isOn ? offStartProgress : onStartProgress
      let previousStateEnd = isOn ? offEndProgress : onEndProgress
      if realtimeProgress.isInRange(min(previousStateStart, previousStateEnd),
                                    max(previousStateStart, previousStateEnd)) {
        /// Animation is currently in the previous time range. Reverse the previous play.
        startProgress = previousStateEnd
        endProgress = previousStateStart
      }
    }

    updateAccessibilityLabel()
    
    guard animated == true else {
      animationView.currentProgress = finalProgress
      return
    }

    if shouldFireHaptics {
      self.hapticGenerator.generateImpact()
    }

    animationView.play(fromProgress: startProgress, toProgress: endProgress, loopMode: LottieLoopMode.playOnce) { (finished) in
      if finished == true {
        self.animationView.currentProgress = finalProgress
      }
    }
  }
  
  public override func endTracking(_ touch: UITouch?, with event: UIEvent?) {
    super.endTracking(touch, with: event)
    updateOnState(isOn: !_isOn, animated: true, shouldFireHaptics: true)
    sendActions(for: .valueChanged)
  }
  
  public override func animationDidSet() {
    updateOnState(isOn: _isOn, animated: true, shouldFireHaptics: false)
  }

  // MARK: Private

  private func updateAccessibilityLabel() {
    accessibilityValue = _isOn ? NSLocalizedString("On", comment: "On") : NSLocalizedString("Off", comment: "Off")
  }
  
}
#endif

protocol ImpactGenerator {
  func generateImpact()
}

class NullHapticGenerator: ImpactGenerator {
  func generateImpact() {
    
  }
}

#if os(iOS)
@available(iOS 10.0, *)
class HapticGenerator: ImpactGenerator {
  func generateImpact() {
    impact.impactOccurred()
  }
  
  fileprivate let impact = UIImpactFeedbackGenerator(style: .light)
}
#endif
