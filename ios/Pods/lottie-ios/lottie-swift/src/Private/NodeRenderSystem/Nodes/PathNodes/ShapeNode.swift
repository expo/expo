//
//  PathNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/16/19.
//

import Foundation
import CoreGraphics

final class ShapeNodeProperties: NodePropertyMap, KeypathSearchable {
  
  var keypathName: String
  
  init(shape: Shape) {
    self.keypathName = shape.name
    self.path = NodeProperty(provider: KeyframeInterpolator(keyframes: shape.path.keyframes))
    self.keypathProperties = [
      "Path" : path
    ]
    self.properties = Array(keypathProperties.values)
  }
  
  let path: NodeProperty<BezierPath>
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
  
}

final class ShapeNode: AnimatorNode, PathNode {
  
  let properties: ShapeNodeProperties

  let pathOutput: PathOutputNode
  
  init(parentNode: AnimatorNode?, shape: Shape) {
    self.pathOutput = PathOutputNode(parent: parentNode?.outputNode)
    self.properties = ShapeNodeProperties(shape: shape)
    self.parentNode = parentNode
  }

  // MARK: Animator Node
  var propertyMap: NodePropertyMap & KeypathSearchable {
    return properties
  }
  
  let parentNode: AnimatorNode?
  var hasLocalUpdates: Bool = false
  var hasUpstreamUpdates: Bool = false
  var lastUpdateFrame: CGFloat? = nil
  var isEnabled: Bool = true {
    didSet{
      self.pathOutput.isEnabled = self.isEnabled
    }
  }
  
  func rebuildOutputs(frame: CGFloat) {
    pathOutput.setPath(properties.path.value, updateFrame: frame)
  }
  
}
