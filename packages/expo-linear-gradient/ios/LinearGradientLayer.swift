// Copyright 2021-present 650 Industries. All rights reserved.

import QuartzCore
import ExpoModulesCore

var defaultStartPoint = CGPoint(x: 0.5, y: 0.0)
var defaultEndPoint = CGPoint(x: 0.5, y: 1.0)
var defaultLocations: [CGFloat] = []

final class LinearGradientLayer: CAGradientLayer {
  private var gradientColors = [UIColor]()
  private var gradientLocations = defaultLocations

  override init() {
    super.init()
    type = .axial
    masksToBounds = true
    needsDisplayOnBoundsChange = false
  }

  override init(layer: Any) {
    super.init(layer: layer)
    if let layer = layer as? LinearGradientLayer {
      gradientColors = layer.gradientColors
      gradientLocations = layer.gradientLocations
    }
    type = .axial
    masksToBounds = true
    needsDisplayOnBoundsChange = false
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setColors(_ colors: [UIColor]) {
    gradientColors = colors
    applyColors()
    syncLocations()
  }

  func setStartPoint(_ startPoint: CGPoint?) {
    self.startPoint = startPoint ?? defaultStartPoint
  }

  func setEndPoint(_ endPoint: CGPoint?) {
    self.endPoint = endPoint ?? defaultEndPoint
  }

  func setLocations(_ locations: [CGFloat]?) {
    gradientLocations = locations ?? defaultLocations
    syncLocations()
  }

  /// Re-resolve dynamic colors after appearance / trait changes.
  func refreshResolvedColors() {
    applyColors()
  }

  private func applyColors() {
    colors = gradientColors.isEmpty ? nil : gradientColors.map(\.cgColor)
  }

  private func syncLocations() {
    let colorCount = gradientColors.count
    guard colorCount >= 2 else {
      locations = nil
      return
    }

    if gradientLocations.count == colorCount {
      locations = gradientLocations.map { NSNumber(value: Double($0)) }
      return
    }

    // Match previous behavior: use provided stops when available, otherwise evenly space.
    locations = (0..<colorCount).map { offset in
      if gradientLocations.count > offset {
        return NSNumber(value: Double(gradientLocations[offset]))
      }
      return NSNumber(value: Double(offset) / Double(colorCount - 1))
    }
  }
}
