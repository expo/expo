//
//  FillRenderer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/30/19.
//

import Foundation
import QuartzCore
import CoreGraphics

extension FillRule {
  var cgFillRule: CGPathFillRule {
    switch self {
    case .evenOdd:
      return .evenOdd
    default:
      return .winding
    }
  }
  
  var caFillRule: CAShapeLayerFillRule {
    switch self {
    case .evenOdd:
      return CAShapeLayerFillRule.evenOdd
    default:
      return CAShapeLayerFillRule.nonZero
    }
  }
}

/// A rendered for a Path Fill
final class FillRenderer: PassThroughOutputNode, Renderable {
  
  let shouldRenderInContext: Bool = false
  
  func updateShapeLayer(layer: CAShapeLayer) {
    layer.fillColor = color
    layer.opacity = Float(opacity)
    layer.fillRule = fillRule.caFillRule
    hasUpdate = false
  }
  
  var color: CGColor? {
    didSet {
      hasUpdate = true
    }
  }
  
  var opacity: CGFloat = 0 {
    didSet {
      hasUpdate = true
    }
  }
  
  var fillRule: FillRule = .none {
    didSet {
      hasUpdate = true
    }
  }
  
  func render(_ inContext: CGContext) {
    guard inContext.path != nil && inContext.path!.isEmpty == false else {
      return
    }
    guard let color = color else { return }
    hasUpdate = false
    inContext.setAlpha(opacity * 0.01)
    inContext.setFillColor(color)
    inContext.fillPath(using: fillRule.cgFillRule)
  }
}
