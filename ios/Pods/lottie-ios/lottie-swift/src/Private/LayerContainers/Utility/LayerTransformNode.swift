//
//  LayerTransformPropertyMap.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation
import CoreGraphics
import QuartzCore

final class LayerTransformProperties: NodePropertyMap, KeypathSearchable {
  
  init(transform: Transform) {
    
    self.anchor = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.anchorPoint.keyframes))
    self.scale = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.scale.keyframes))
    self.rotation = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.rotation.keyframes))
    self.opacity = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.opacity.keyframes))
    
    var propertyMap: [String: AnyNodeProperty] = [
      "Anchor Point" : anchor,
      "Scale" : scale,
      "Rotation" : rotation,
      "Opacity" : opacity
    ]
    
    if let positionKeyframesX = transform.positionX?.keyframes,
      let positionKeyframesY = transform.positionY?.keyframes {
      let xPosition: NodeProperty<Vector1D> = NodeProperty(provider: KeyframeInterpolator(keyframes: positionKeyframesX))
      let yPosition: NodeProperty<Vector1D> = NodeProperty(provider: KeyframeInterpolator(keyframes: positionKeyframesY))
      propertyMap["X Position"] = xPosition
      propertyMap["Y Position"] = yPosition
      self.positionX = xPosition
      self.positionY = yPosition
      self.position = nil
    } else if let positionKeyframes = transform.position?.keyframes {
      let position: NodeProperty<Vector3D> = NodeProperty(provider: KeyframeInterpolator(keyframes: positionKeyframes))
      propertyMap["Position"] = position
      self.position = position
      self.positionX = nil
      self.positionY = nil
    } else {
      self.position = nil
      self.positionY = nil
      self.positionX = nil
    }
    
    self.keypathProperties = propertyMap
    self.properties = Array(propertyMap.values)
  }
  
  let keypathProperties: [String : AnyNodeProperty]
  var keypathName: String = "Transform"
  
  var childKeypaths: [KeypathSearchable] {
    return []
  }
  
  let properties: [AnyNodeProperty]
  
  let anchor: NodeProperty<Vector3D>
  let scale: NodeProperty<Vector3D>
  let rotation: NodeProperty<Vector1D>
  let position: NodeProperty<Vector3D>?
  let positionX: NodeProperty<Vector1D>?
  let positionY: NodeProperty<Vector1D>?
  let opacity: NodeProperty<Vector1D>
  
}

class LayerTransformNode: AnimatorNode {
  let outputNode: NodeOutput = PassThroughOutputNode(parent: nil)
  
  init(transform: Transform) {
    self.transformProperties = LayerTransformProperties(transform: transform)
  }
  
  let transformProperties: LayerTransformProperties
  
  // MARK: Animator Node Protocol
  
  var propertyMap: NodePropertyMap & KeypathSearchable {
    return transformProperties
  }
  
  var parentNode: AnimatorNode?
  var hasLocalUpdates: Bool = false
  var hasUpstreamUpdates: Bool = false
  var lastUpdateFrame: CGFloat? = nil
  var isEnabled: Bool = true
  
  func shouldRebuildOutputs(frame: CGFloat) -> Bool {
    return hasLocalUpdates || hasUpstreamUpdates
  }
  
  func rebuildOutputs(frame: CGFloat) {
    opacity = Float(transformProperties.opacity.value.cgFloatValue) * 0.01
    
    let position: CGPoint
    if let point = transformProperties.position?.value.pointValue {
      position = point
    } else if let xPos = transformProperties.positionX?.value.cgFloatValue,
      let yPos = transformProperties.positionY?.value.cgFloatValue {
      position = CGPoint(x: xPos, y: yPos)
    } else {
      position = .zero
    }
    
    localTransform = CATransform3D.makeTransform(anchor: transformProperties.anchor.value.pointValue,
                                                 position: position,
                                                 scale: transformProperties.scale.value.sizeValue,
                                                 rotation: transformProperties.rotation.value.cgFloatValue,
                                                 skew: nil,
                                                 skewAxis: nil)
    
    if let parentNode = parentNode as? LayerTransformNode {
      globalTransform = CATransform3DConcat(localTransform, parentNode.globalTransform)
    } else {
      globalTransform = localTransform
    }
  }
  
  var opacity: Float = 1
  var localTransform: CATransform3D = CATransform3DIdentity
  var globalTransform: CATransform3D = CATransform3DIdentity
  
}
