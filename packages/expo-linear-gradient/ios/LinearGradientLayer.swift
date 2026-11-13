// Copyright 2021-present 650 Industries. All rights reserved.

import QuartzCore
import CoreGraphics
import ExpoModulesCore

var defaultStartPoint = CGPoint(x: 0.5, y: 0.0)
var defaultEndPoint = CGPoint(x: 0.5, y: 1.0)
var defaultLocations: [CGFloat] = []

// A CAGradientLayer is drawn by the GPU at composite time. Painting the gradient into a bitmap instead kept
// width x height x scale^2 x 4 bytes per gradient in memory, e.g. 4.9 MB for a 402 x 337 pt view at 3x.
final class LinearGradientLayer: CAGradientLayer {
  private var uiColors = [UIColor]()
  private var stopLocations = defaultLocations

  override init() {
    super.init()
    self.masksToBounds = true
  }

  override init(layer: Any) {
    super.init(layer: layer)
    self.masksToBounds = true
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setColors(_ colors: [UIColor]) {
    uiColors = colors
    applyColors()
  }

  func setStartPoint(_ startPoint: CGPoint?) {
    self.startPoint = startPoint ?? defaultStartPoint
  }

  func setEndPoint(_ endPoint: CGPoint?) {
    self.endPoint = endPoint ?? defaultEndPoint
  }

  func setLocations(_ locations: [CGFloat]?) {
    stopLocations = locations ?? defaultLocations
    applyLocations()
  }

  // Dynamic colors resolve when converted, so the view calls this again when the appearance changes.
  func applyColors() {
    // CAGradientLayer draws nothing for a single color, where the stock layer filled it.
    let cgColors = uiColors.map { $0.cgColor }
    self.colors = cgColors.count == 1 ? [cgColors[0], cgColors[0]] : cgColors
    applyLocations()
  }

  // Same stops as the stock layer: given locations first, the rest spread evenly by index.
  private func applyLocations() {
    let count = uiColors.count
    guard count > 1 else {
      self.locations = nil
      return
    }
    self.locations = (0..<count).map { offset in
      let location = stopLocations.count > offset ? stopLocations[offset] : CGFloat(offset) / CGFloat(count - 1)
      return NSNumber(value: Double(location))
    }
  }
}
