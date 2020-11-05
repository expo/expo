//
//  TextAnimatorNode.swift
//  lottie-ios-iOS
//
//  Created by Brandon Withrow on 2/19/19.
//

import Foundation
import CoreGraphics
import QuartzCore

final class TextAnimatorNodeProperties: NodePropertyMap, KeypathSearchable {
  
  let keypathName: String
  
  init(textAnimator: TextAnimator) {
    self.keypathName = textAnimator.name
    var properties = [String : AnyNodeProperty]()
    
    if let keyframeGroup = textAnimator.anchor {
      self.anchor = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Anchor"] = self.anchor
    } else {
      self.anchor = nil
    }
    
    if let keyframeGroup = textAnimator.position {
      self.position = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Position"] = self.position
    } else {
      self.position = nil
    }
    
    if let keyframeGroup = textAnimator.scale {
      self.scale = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Scale"] = self.scale
    } else {
      self.scale = nil
    }
    
    if let keyframeGroup = textAnimator.skew {
      self.skew = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Skew"] = self.skew
    } else {
      self.skew = nil
    }
    
    if let keyframeGroup = textAnimator.skewAxis {
      self.skewAxis = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Skew Axis"] = self.skewAxis
    } else {
      self.skewAxis = nil
    }
    
    if let keyframeGroup = textAnimator.rotation {
      self.rotation = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Rotation"] = self.rotation
    } else {
      self.rotation = nil
    }
    
    if let keyframeGroup = textAnimator.opacity {
      self.opacity = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Opacity"] = self.opacity
    } else {
      self.opacity = nil
    }
    
    if let keyframeGroup = textAnimator.strokeColor {
      self.strokeColor = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Stroke Color"] = self.strokeColor
    } else {
      self.strokeColor = nil
    }
    
    if let keyframeGroup = textAnimator.fillColor {
      self.fillColor = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Fill Color"] = self.fillColor
    } else {
      self.fillColor = nil
    }
    
    if let keyframeGroup = textAnimator.strokeWidth {
      self.strokeWidth = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Stroke Width"] = self.strokeWidth
    } else {
      self.strokeWidth = nil
    }
    
    if let keyframeGroup = textAnimator.tracking {
      self.tracking = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframeGroup.keyframes))
      properties["Tracking"] = self.tracking
    } else {
      self.tracking = nil
    }
    
    self.keypathProperties = properties
    
    self.properties = Array(keypathProperties.values)
  }
  
  let anchor: NodeProperty<Vector3D>?
  let position: NodeProperty<Vector3D>?
  let scale: NodeProperty<Vector3D>?
  let skew: NodeProperty<Vector1D>?
  let skewAxis: NodeProperty<Vector1D>?
  let rotation: NodeProperty<Vector1D>?
  let opacity: NodeProperty<Vector1D>?
  let strokeColor: NodeProperty<Color>?
  let fillColor: NodeProperty<Color>?
  let strokeWidth: NodeProperty<Vector1D>?
  let tracking: NodeProperty<Vector1D>?
  
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
  
  var caTransform: CATransform3D {
    return CATransform3D.makeTransform(anchor: anchor?.value.pointValue ?? .zero,
                                       position: position?.value.pointValue ?? .zero,
                                       scale: scale?.value.sizeValue ?? CGSize(width: 100, height: 100),
                                       rotation: rotation?.value.cgFloatValue ?? 0,
                                       skew: skew?.value.cgFloatValue,
                                       skewAxis: skewAxis?.value.cgFloatValue)
  }
}

final class TextOutputNode: NodeOutput {
  
  var parent: NodeOutput? {
    return parentTextNode
  }
  
  var parentTextNode: TextOutputNode?
  var isEnabled: Bool = true
  
  init(parent: TextOutputNode?) {
    self.parentTextNode = parent
  }

  fileprivate var _xform: CATransform3D?
  fileprivate var _opacity: CGFloat?
  fileprivate var _strokeColor: CGColor?
  fileprivate var _fillColor: CGColor?
  fileprivate var _tracking: CGFloat?
  fileprivate var _strokeWidth: CGFloat?
  
  var xform: CATransform3D {
    get {
      return _xform ?? parentTextNode?.xform ?? CATransform3DIdentity
    }
    set {
      _xform = newValue
    }
  }
  
  var opacity: CGFloat {
    get {
      return _opacity ?? parentTextNode?.opacity ?? 1
    }
    set {
      _opacity = newValue
    }
  }
  
  var strokeColor: CGColor? {
    get {
      return _strokeColor ?? parentTextNode?.strokeColor
    }
    set {
      _strokeColor = newValue
    }
  }
  
  var fillColor: CGColor? {
    get {
      return _fillColor ?? parentTextNode?.fillColor
    }
    set {
      _fillColor = newValue
    }
  }
  
  var tracking: CGFloat {
    get {
      return _tracking ?? parentTextNode?.tracking ?? 0
    }
    set {
      _tracking = newValue
    }
  }
  
  var strokeWidth: CGFloat {
    get {
      return _strokeWidth ?? parentTextNode?.strokeWidth ?? 0
    }
    set {
      _strokeWidth = newValue
    }
  }
  
  
  func hasOutputUpdates(_ forFrame: CGFloat) -> Bool {
    // TODO Fix This
    return true
  }
  
  var outputPath: CGPath?
  
}

class TextAnimatorNode: AnimatorNode {
  
  let textOutputNode: TextOutputNode
  
  var outputNode: NodeOutput {
    return textOutputNode
  }
  
  let textAnimatorProperties: TextAnimatorNodeProperties
  
  init(parentNode: TextAnimatorNode?, textAnimator: TextAnimator) {
    self.textOutputNode = TextOutputNode(parent: parentNode?.textOutputNode)
    self.textAnimatorProperties = TextAnimatorNodeProperties(textAnimator: textAnimator)
    self.parentNode = parentNode
  }
  
  // MARK: Animator Node Protocol
  
  var propertyMap: NodePropertyMap & KeypathSearchable {
    return textAnimatorProperties
  }
  
  let parentNode: AnimatorNode?
  var hasLocalUpdates: Bool = false
  var hasUpstreamUpdates: Bool = false
  var lastUpdateFrame: CGFloat? = nil
  var isEnabled: Bool = true
  
  func localUpdatesPermeateDownstream() -> Bool {
    return true
  }
  
  func rebuildOutputs(frame: CGFloat) {
    textOutputNode.xform = textAnimatorProperties.caTransform
    textOutputNode.opacity = (textAnimatorProperties.opacity?.value.cgFloatValue ?? 100) * 0.01
    textOutputNode.strokeColor = textAnimatorProperties.strokeColor?.value.cgColorValue
    textOutputNode.fillColor = textAnimatorProperties.fillColor?.value.cgColorValue
    textOutputNode.tracking = textAnimatorProperties.tracking?.value.cgFloatValue ?? 1
    textOutputNode.strokeWidth = textAnimatorProperties.strokeWidth?.value.cgFloatValue ?? 0
  }
}
