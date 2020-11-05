//
//  EllipseNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/17/19.
//

import Foundation
import QuartzCore

final class EllipseNodeProperties: NodePropertyMap, KeypathSearchable {
  
  var keypathName: String
  
  init(ellipse: Ellipse) {
    self.keypathName = ellipse.name
    self.direction = ellipse.direction
    self.position = NodeProperty(provider: KeyframeInterpolator(keyframes: ellipse.position.keyframes))
    self.size = NodeProperty(provider: KeyframeInterpolator(keyframes: ellipse.size.keyframes))
    self.keypathProperties = [
      "Position" : position,
      "Size" : size
    ]
    self.properties = Array(keypathProperties.values)
  }
  
  let direction: PathDirection
  let position: NodeProperty<Vector3D>
  let size: NodeProperty<Vector3D>
  
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
}

final class EllipseNode: AnimatorNode, PathNode {
  
  let pathOutput: PathOutputNode
  
  let properties: EllipseNodeProperties

  init(parentNode: AnimatorNode?, ellipse: Ellipse) {
    self.pathOutput = PathOutputNode(parent: parentNode?.outputNode)
    self.properties = EllipseNodeProperties(ellipse: ellipse)
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
    let ellipseSize = properties.size.value.sizeValue
    let center = properties.position.value.pointValue
    
    // Unfortunately we HAVE to manually build out the ellipse.
    // Every Apple method constructs an ellipse from the 3 o-clock position
    // After effects constructs from the Noon position.
    // After effects does clockwise, but also has a flag for reversed.
    
    var half = ellipseSize * 0.5
    if properties.direction == .counterClockwise {
      half.width = half.width * -1
    }
    
    
    let q1 = CGPoint(x: center.x, y: center.y - half.height)
    let q2 = CGPoint(x: center.x + half.width, y: center.y)
    let q3 = CGPoint(x: center.x, y: center.y + half.height)
    let q4 = CGPoint(x: center.x - half.width, y: center.y)
    
    let cp = half * EllipseNode.ControlPointConstant
    
    var path = BezierPath(startPoint: CurveVertex(point: q1,
                                                  inTangentRelative: CGPoint(x: -cp.width, y: 0),
                                                  outTangentRelative: CGPoint(x: cp.width, y: 0)))
    path.addVertex(CurveVertex(point: q2,
                               inTangentRelative: CGPoint(x: 0, y: -cp.height),
                               outTangentRelative: CGPoint(x: 0, y: cp.height)))
    
    path.addVertex(CurveVertex(point: q3,
                               inTangentRelative: CGPoint(x: cp.width, y: 0),
                               outTangentRelative: CGPoint(x: -cp.width, y: 0)))
    
    path.addVertex(CurveVertex(point: q4,
                               inTangentRelative: CGPoint(x: 0, y: cp.height),
                               outTangentRelative: CGPoint(x: 0, y: -cp.height)))
    
    path.addVertex(CurveVertex(point: q1,
                               inTangentRelative: CGPoint(x: -cp.width, y: 0),
                               outTangentRelative: CGPoint(x: cp.width, y: 0)))
    path.close()
    pathOutput.setPath(path, updateFrame: frame)
  }

  static let ControlPointConstant: CGFloat = 0.55228
  
}
