// Copyright 2021-present 650 Industries. All rights reserved.

import QuartzCore
import CoreGraphics

var defaultStartPoint = CGPoint(x: 0.5, y: 0.0)
var defaultEndPoint = CGPoint(x: 0.5, y: 1.0)
var defaultLocations: [CGFloat] = []

final class LinearGradientLayer: CALayer {
  var colors = [UIColor]()
  var startPoint = defaultStartPoint
  var endPoint = defaultEndPoint
  var locations = defaultLocations

  override init() {
    super.init()
    self.needsDisplayOnBoundsChange = true
    self.masksToBounds = true
  }
  
  override init(layer: Any) {
    super.init(layer: layer)
    self.needsDisplayOnBoundsChange = true
    self.masksToBounds = true
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setColors(_ colors: [UIColor]) {
    self.colors = colors
    setNeedsDisplay()
  }

  func setStartPoint(_ startPoint: CGPoint?) {
    self.startPoint = startPoint ?? defaultStartPoint
    setNeedsDisplay()
  }

  func setEndPoint(_ endPoint: CGPoint?) {
    self.endPoint = endPoint ?? defaultEndPoint
    setNeedsDisplay()
  }

  func setLocations(_ locations: [CGFloat]?) {
    self.locations = locations ?? defaultLocations
    setNeedsDisplay()
  }

  override func display() {
    super.display()

    if colors.isEmpty || bounds.size.width.isZero || bounds.size.height.isZero {
      return
    }
    let hasAlpha = colors.reduce(false) { result, color in
      return result || color.cgColor.alpha < 1.0
    }

    UIGraphicsBeginImageContextWithOptions(bounds.size, !hasAlpha, 0.0)

    guard let contextRef = UIGraphicsGetCurrentContext() else {
      return
    }

    draw(in: contextRef)

    guard let image = UIGraphicsGetImageFromCurrentImageContext() else {
      return
    }

    self.contents = image.cgImage
    self.contentsScale = image.scale

    UIGraphicsEndImageContext()
  }

  override func draw(in ctx: CGContext) {
    super.draw(in: ctx)

    ctx.saveGState()

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let locations = colors.enumerated().map { (offset: Int, _: UIColor) -> CGFloat in
      if self.locations.count > offset {
        return self.locations[offset]
      } else {
        return CGFloat(offset) / CGFloat(colors.count - 1)
      }
    }
    let cgColors = colors.map { $0.cgColor } as CFArray

    if let gradient = CGGradient(colorsSpace: colorSpace, colors: cgColors, locations: locations) {
      let size = bounds.size

      ctx.drawLinearGradient(
        gradient,
        start: CGPoint(x: startPoint.x * size.width, y: startPoint.y * size.height),
        end: CGPoint(x: endPoint.x * size.width, y: endPoint.y * size.height),
        options: [.drawsBeforeStartLocation, .drawsAfterEndLocation]
      )
    }

    ctx.restoreGState()
  }
}
