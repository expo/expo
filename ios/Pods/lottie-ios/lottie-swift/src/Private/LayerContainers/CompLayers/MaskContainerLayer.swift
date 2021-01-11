//
//  MaskContainerLayer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/25/19.
//

import Foundation
import QuartzCore

extension MaskMode {
  var usableMode: MaskMode {
    switch self {
    case .add:
      return .add
    case .subtract:
      return .subtract
    case .intersect:
      return .intersect
    case .lighten:
      return .add
    case .darken:
      return .darken
    case .difference:
      return .intersect
    case .none:
      return .none
    }
  }
}

final class MaskContainerLayer: CALayer {
  
  init(masks: [Mask]) {
    super.init()
    anchorPoint = .zero
    var containerLayer = CALayer()
    var firstObject: Bool = true
    for mask in masks {
      let maskLayer = MaskLayer(mask: mask)
      maskLayers.append(maskLayer)
      if mask.mode.usableMode == .none {
        continue
      } else if mask.mode.usableMode == .add || firstObject {
        firstObject = false
        containerLayer.addSublayer(maskLayer)
      } else {
        containerLayer.mask = maskLayer
        let newContainer = CALayer()
        newContainer.addSublayer(containerLayer)
        containerLayer = newContainer
      }
    }
    addSublayer(containerLayer)
  }
  
  override init(layer: Any) {
    /// Used for creating shadow model layers. Read More here: https://developer.apple.com/documentation/quartzcore/calayer/1410842-init
    guard let layer = layer as? MaskContainerLayer else {
      fatalError("init(layer:) Wrong Layer Class")
    }
    super.init(layer: layer)
  }
  
  fileprivate var maskLayers: [MaskLayer] = []
  
  func updateWithFrame(frame: CGFloat, forceUpdates: Bool) {
    maskLayers.forEach({ $0.updateWithFrame(frame: frame, forceUpdates: forceUpdates) })
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

extension CGRect {
  static var veryLargeRect: CGRect {
    return CGRect(x: -100_000_000,
                  y: -100_000_000,
                  width: 200_000_000,
                  height: 200_000_000)
  }
}

fileprivate class MaskLayer: CALayer {
  
  let properties: MaskNodeProperties?
  
  let maskLayer = CAShapeLayer()
  
  init(mask: Mask) {
    self.properties = MaskNodeProperties(mask: mask)
    super.init()
    addSublayer(maskLayer)
    anchorPoint = .zero
    maskLayer.fillColor = mask.mode == .add ? CGColor(colorSpace: CGColorSpaceCreateDeviceRGB(), components: [1, 0, 0, 1]) :
      CGColor(colorSpace: CGColorSpaceCreateDeviceRGB(), components: [0, 1, 0, 1])
    maskLayer.fillRule = CAShapeLayerFillRule.evenOdd
    self.actions = [
      "opacity" : NSNull()
    ]
    
  }
  
  override init(layer: Any) {
    self.properties = nil
    super.init(layer: layer)
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  func updateWithFrame(frame: CGFloat, forceUpdates: Bool) {
    guard let properties = properties else { return }
    if properties.opacity.needsUpdate(frame: frame) || forceUpdates {
      properties.opacity.update(frame: frame)
      self.opacity = Float(properties.opacity.value.cgFloatValue)
    }
    
    if properties.shape.needsUpdate(frame: frame) || forceUpdates {
      properties.shape.update(frame: frame)
      properties.expansion.update(frame: frame)
      
      let shapePath = properties.shape.value.cgPath()
      var path = shapePath
      if properties.mode.usableMode == .subtract && !properties.inverted ||
        (properties.mode.usableMode == .add && properties.inverted) {
        /// Add a bounds rect to invert the mask
        let newPath = CGMutablePath()
        newPath.addRect(CGRect.veryLargeRect)
        newPath.addPath(shapePath)
        path = newPath
      }
      maskLayer.path = path
    }
    
  }
}

fileprivate class MaskNodeProperties: NodePropertyMap {
  
  var propertyMap: [String : AnyNodeProperty]
  
  var properties: [AnyNodeProperty]
  
  init(mask: Mask) {
    self.mode = mask.mode
    self.inverted = mask.inverted
    self.opacity = NodeProperty(provider: KeyframeInterpolator(keyframes: mask.opacity.keyframes))
    self.shape = NodeProperty(provider: KeyframeInterpolator(keyframes: mask.shape.keyframes))
    self.expansion = NodeProperty(provider: KeyframeInterpolator(keyframes: mask.expansion.keyframes))
    self.propertyMap = [
      "Opacity" : opacity,
      "Shape" : shape,
      "Expansion" : expansion
    ]
    self.properties = Array(self.propertyMap.values)
  }
  
  let mode: MaskMode
  let inverted: Bool
  
  let opacity: NodeProperty<Vector1D>
  let shape: NodeProperty<BezierPath>
  let expansion: NodeProperty<Vector1D>
}

