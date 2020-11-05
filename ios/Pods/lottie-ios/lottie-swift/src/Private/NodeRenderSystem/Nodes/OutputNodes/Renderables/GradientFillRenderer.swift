//
//  GradientFillRenderer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/30/19.
//

import Foundation
import QuartzCore

/// A rendered for a Path Fill
final class GradientFillRenderer: PassThroughOutputNode, Renderable {
  
  var shouldRenderInContext: Bool = true
  
  func updateShapeLayer(layer: CAShapeLayer) {
    // Not applicable
  }
  
  func render(_ inContext: CGContext) {
    guard inContext.path != nil && inContext.path!.isEmpty == false else {
      return
    }
    hasUpdate = false
    var alphaColors = [CGColor]()
    var alphaLocations = [CGFloat]()
    
    var gradientColors = [CGColor]()
    var colorLocations = [CGFloat]()
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let maskColorSpace = CGColorSpaceCreateDeviceGray()
    for i in 0..<numberOfColors {
      let ix = i * 4
        if colors.count > ix, let color = CGColor(colorSpace: colorSpace, components: [colors[ix + 1], colors[ix + 2], colors[ix + 3], 1]) {
        gradientColors.append(color)
        colorLocations.append(colors[ix])
      }
    }
    
    var drawMask = false
    for i in stride(from: (numberOfColors * 4), to: colors.endIndex, by: 2) {
      let alpha = colors[i + 1]
      if alpha < 1 {
        drawMask = true
      }
      if let color = CGColor(colorSpace: maskColorSpace, components: [alpha, 1]) {
        alphaLocations.append(colors[i])
        alphaColors.append(color)
      }
    }
    
    inContext.setAlpha(opacity)
    inContext.clip()
    
    /// First draw a mask is necessary.
    if drawMask {
      guard let maskGradient = CGGradient(colorsSpace: maskColorSpace,
                                          colors: alphaColors as CFArray,
                                          locations: alphaLocations),
        let maskContext = CGContext(data: nil,
                                    width: inContext.width,
                                    height: inContext.height,
                                    bitsPerComponent: 8,
                                    bytesPerRow: inContext.width,
                                    space: maskColorSpace,
                                    bitmapInfo: 0) else { return }
      let flipVertical = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: CGFloat(maskContext.height))
      maskContext.concatenate(flipVertical)
      maskContext.concatenate(inContext.ctm)
      if type == .linear {
        maskContext.drawLinearGradient(maskGradient, start: start, end: end, options: [.drawsAfterEndLocation, .drawsBeforeStartLocation])
      } else {
        maskContext.drawRadialGradient(maskGradient, startCenter: start, startRadius: 0, endCenter: start, endRadius: start.distanceTo(end), options: [.drawsAfterEndLocation, .drawsBeforeStartLocation])
      }
      /// Clips the gradient
      if let alphaMask = maskContext.makeImage() {
        inContext.clip(to: inContext.boundingBoxOfClipPath, mask: alphaMask)
      }
    }
    
    /// Now draw the gradient
    guard let gradient = CGGradient(colorsSpace: colorSpace, colors: gradientColors as CFArray, locations: colorLocations) else { return }
    if type == .linear {
      inContext.drawLinearGradient(gradient, start: start, end: end, options: [.drawsAfterEndLocation, .drawsBeforeStartLocation])
    } else {
      inContext.drawRadialGradient(gradient, startCenter: start, startRadius: 0, endCenter: start, endRadius: start.distanceTo(end), options: [.drawsAfterEndLocation, .drawsBeforeStartLocation])
    }
  }
  
  var start: CGPoint = .zero {
    didSet {
      hasUpdate = true
    }
  }
  
  var numberOfColors: Int = 0 {
    didSet {
      hasUpdate = true
    }
  }
  
  var colors: [CGFloat] = [] {
    didSet {
      hasUpdate = true
    }
  }
  
  var end: CGPoint = .zero {
    didSet {
      hasUpdate = true
    }
  }
  
  var opacity: CGFloat = 0 {
    didSet {
      hasUpdate = true
    }
  }
  
  var type: GradientType = .none {
    didSet {
      hasUpdate = true
    }
  }
  
}
