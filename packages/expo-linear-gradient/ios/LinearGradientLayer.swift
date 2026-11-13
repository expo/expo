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
  private var requestedStartPoint = defaultStartPoint
  private var requestedEndPoint = defaultEndPoint

  override var bounds: CGRect {
    didSet {
      if bounds.size != oldValue.size {
        applyPoints()
      }
    }
  }

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
    requestedStartPoint = startPoint ?? defaultStartPoint
    applyPoints()
  }

  func setEndPoint(_ endPoint: CGPoint?) {
    requestedEndPoint = endPoint ?? defaultEndPoint
    applyPoints()
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

  // CAGradientLayer keeps color bands perpendicular to the axis in unit space, which tilts them on a
  // non-square view. Android, web and the previous bitmap keep them perpendicular in points, so the end
  // point is moved along (width² · dx, height² · dy), which gives every pixel the same color as there.
  private func applyPoints() {
    let start = requestedStartPoint
    let dx = requestedEndPoint.x - start.x
    let dy = requestedEndPoint.y - start.y
    let a = bounds.width * bounds.width * dx
    let b = bounds.height * bounds.height * dy
    let norm = a * a + b * b
    self.startPoint = start
    guard norm > 0 else {
      self.endPoint = requestedEndPoint
      return
    }
    let scale = (a * dx + b * dy) / norm
    self.endPoint = CGPoint(x: start.x + a * scale, y: start.y + b * scale)
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
