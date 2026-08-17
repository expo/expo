// Copyright 2021-present 650 Industries. All rights reserved.

import QuartzCore
import CoreGraphics
import ExpoModulesCore

let defaultStartPoint = CGPoint(x: 0.5, y: 0.0) // == CAGradientLayer's own default
let defaultEndPoint = CGPoint(x: 0.5, y: 1.0)   // == CAGradientLayer's own default

/**
 A `CAGradientLayer` subclass fed by the props of `LinearGradientModule`.

 Previous implementations subclassed `CALayer` and CPU-rasterized the gradient
 into a full-resolution bitmap on the main thread on every `display()`
 (`UIGraphicsBeginImageContextWithOptions` → `CGContextDrawLinearGradient`).
 Screens composing many gradients re-rasterized all of them inside a single
 CA transaction whenever bounds or traits changed (rotation, foregrounding,
 appearance switches), which shows up in the field as multi-second main-thread
 hangs on thermally-throttled devices, and as crashes when the bounds were
 non-finite (UIGraphics size assertions).

 `CAGradientLayer` shades on the render server instead: no main-thread raster
 work, no backing-store bitmap, and bounds changes are free because the
 endpoints live in the unit coordinate space. Visual output is unchanged: the
 default axis, the even-spacing locations fallback and the edge clamping
 (`drawsBefore/AfterStartLocation`) all match CAGradientLayer's semantics.

 Platform orientation note: the unit coordinate space follows each platform's
 layer geometry — top-left origin on iOS/tvOS, bottom-left on macOS — which
 reproduces the previous CPU implementation exactly (its UIKit image context
 was flipped on iOS/tvOS while its hand-built macOS `CGContext` was not).
 */
final class LinearGradientLayer: CAGradientLayer {
  // `CAGradientLayer` already declares `colors`, `startPoint`, `endPoint` and
  // `locations`, so the JS-provided values are retained under different names.
  // Keeping the UIColors (not just their CGColor projections) lets `display()`
  // re-resolve dynamic colors against the current traits when the hosting view
  // calls `setNeedsDisplay()` from `traitCollectionDidChange` /
  // `viewDidChangeEffectiveAppearance`.
  private var sourceColors: [UIColor] = []
  private var sourceLocations: [CGFloat] = []

  override init() {
    super.init()
    self.masksToBounds = true
    // Intentionally NOT setting `needsDisplayOnBoundsChange`: resizing a
    // CAGradientLayer requires no redisplay (unit-space endpoints).
    self.startPoint = defaultStartPoint
    self.endPoint = defaultEndPoint
  }

  override init(layer: Any) {
    // Presentation/model copies: super copies all CAGradientLayer properties
    // (colors, locations, start/end points, masksToBounds); only the custom
    // stored state needs copying here. Do not re-apply defaults — that would
    // clobber the copied values.
    super.init(layer: layer)
    if let layer = layer as? LinearGradientLayer {
      self.sourceColors = layer.sourceColors
      self.sourceLocations = layer.sourceLocations
    }
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // The set* methods below are plain Swift methods (final class, no @objc
  // inference), so they cannot collide with the Objective-C setters of the
  // superclass properties (`setColors:`, `setLocations:`, ...). @nonobjc
  // makes that guarantee explicit.

  @nonobjc func setColors(_ colors: [UIColor]) {
    sourceColors = colors
    applyGradient()
  }

  @nonobjc func setStartPoint(_ startPoint: CGPoint?) {
    withDisabledActions {
      self.startPoint = startPoint ?? defaultStartPoint
    }
  }

  @nonobjc func setEndPoint(_ endPoint: CGPoint?) {
    withDisabledActions {
      self.endPoint = endPoint ?? defaultEndPoint
    }
  }

  @nonobjc func setLocations(_ locations: [CGFloat]?) {
    sourceLocations = locations ?? []
    applyGradient()
  }

  // `LinearGradientView` calls `layer.setNeedsDisplay()` on trait/appearance
  // changes. A CAGradientLayer has no backing store to redraw, so `display()`
  // is repurposed to re-resolve possibly-dynamic colors under the new traits.
  // Deliberately does NOT call super: CALayer's default `display()` would walk
  // the delegate drawing path and could allocate a useless backing store.
  override func display() {
    applyGradient()
  }

  private func applyGradient() {
    withDisabledActions {
      if sourceColors.isEmpty {
        self.colors = nil
        self.locations = nil
        return
      }
      self.colors = sourceColors.map { $0.cgColor }
      self.locations = effectiveLocations()
    }
  }

  // Mirrors the previous implementation's semantics exactly: entries missing
  // from the `locations` prop fall back to an even distribution (i / (n - 1));
  // extra entries beyond `colors.count` are ignored. Returning nil means
  // "uniform", which is CAGradientLayer's native behavior and equals the
  // fallback formula. (Also fixes the previous n == 1 division by zero.)
  private func effectiveLocations() -> [NSNumber]? {
    if sourceLocations.isEmpty || sourceColors.count < 2 {
      return nil
    }
    return sourceColors.enumerated().map { offset, _ in
      if sourceLocations.count > offset {
        return NSNumber(value: Double(sourceLocations[offset]))
      }
      return NSNumber(value: Double(offset) / Double(sourceColors.count - 1))
    }
  }

  // colors/locations/startPoint/endPoint are all implicitly animatable. UIKit
  // suppresses implicit actions for a view's backing layer outside UIView
  // animation blocks, but not inside them, and AppKit backing layers behave
  // differently — so actions are disabled explicitly on every mutation path
  // for deterministic, animation-free prop application.
  private func withDisabledActions(_ body: () -> Void) {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    body()
    CATransaction.commit()
  }
}
