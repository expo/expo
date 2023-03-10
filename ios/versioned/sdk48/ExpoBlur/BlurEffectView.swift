// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

/**
 This class is based on https://gist.github.com/darrarski/29a2a4515508e385c90b3ffe6f975df7
 */
final class BlurEffectView: UIVisualEffectView {
  @Clamping(lowerBound: 0.01, upperBound: 1)
  var intensity: Double = 0.5 {
    didSet {
      setNeedsDisplay()
    }
  }

  @Containing(values: ["default", "light", "dark"])
  var tint = "default" {
    didSet {
      visualEffect = UIBlurEffect(style: blurEffectStyleFrom(tint))
    }
  }

  private var visualEffect: UIVisualEffect = UIBlurEffect(style: blurEffectStyleFrom("default")) {
    didSet {
      setNeedsDisplay()
    }
  }
  private var animator: UIViewPropertyAnimator?

  init() {
    super.init(effect: nil)
  }

  required init?(coder aDecoder: NSCoder) { nil }

  deinit {
    animator?.stopAnimation(true)
  }

  override func draw(_ rect: CGRect) {
    super.draw(rect)
    effect = nil
    animator?.stopAnimation(true)
    animator = UIViewPropertyAnimator(duration: 1, curve: .linear) { [unowned self] in
      self.effect = visualEffect
    }
    animator?.fractionComplete = CGFloat(intensity)
  }
}

private func blurEffectStyleFrom(_ tint: String) -> UIBlurEffect.Style {
  switch tint {
  case "light": return .extraLight
  case "dark": return .dark
  case "default": return .light
  default: return .dark
  }
}

/**
 Property wrapper clamping the value between an upper and lower bound
 */
@propertyWrapper
struct Clamping<Value: Comparable> {
  var wrappedValue: Value

  init(wrappedValue: Value, lowerBound: Value, upperBound: Value) {
    self.wrappedValue = max(lowerBound, min(upperBound, wrappedValue))
  }
}

/**
 Property wrapper ensuring that the value is contained in list of valid values
 */
@propertyWrapper
struct Containing<Value: Equatable> {
  var wrappedValue: Value

  init(wrappedValue: Value, values: [Value]) {
    let isValueValid = values.contains(wrappedValue)
    self.wrappedValue = isValueValid ? wrappedValue : values.first!
  }
}
