//
//  PolygonNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/21/19.
//

import Foundation
import QuartzCore

final class PolygonNodeProperties: NodePropertyMap, KeypathSearchable {
  
  var keypathName: String

  var childKeypaths: [KeypathSearchable] = []
  
  init(star: Star) {
    self.keypathName = star.name
    self.direction = star.direction
    self.position = NodeProperty(provider: KeyframeInterpolator(keyframes: star.position.keyframes))
    self.outerRadius = NodeProperty(provider: KeyframeInterpolator(keyframes: star.outerRadius.keyframes))
    self.outerRoundedness = NodeProperty(provider: KeyframeInterpolator(keyframes: star.outerRoundness.keyframes))
    self.rotation = NodeProperty(provider: KeyframeInterpolator(keyframes: star.rotation.keyframes))
    self.points = NodeProperty(provider: KeyframeInterpolator(keyframes: star.points.keyframes))
    self.keypathProperties = [
      "Position" : position,
      "Outer Radius" : outerRadius,
      "Outer Roundedness" : outerRoundedness,
      "Rotation" : rotation,
      "Points" : points
    ]
    self.properties = Array(keypathProperties.values)
  }
  
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
  
  let direction: PathDirection
  let position: NodeProperty<Vector3D>
  let outerRadius: NodeProperty<Vector1D>
  let outerRoundedness: NodeProperty<Vector1D>
  let rotation: NodeProperty<Vector1D>
  let points: NodeProperty<Vector1D>
}

final class PolygonNode: AnimatorNode, PathNode {
  
  let properties: PolygonNodeProperties
  
  let pathOutput: PathOutputNode
  
  init(parentNode: AnimatorNode?, star: Star) {
    self.pathOutput = PathOutputNode(parent: parentNode?.outputNode)
    self.properties = PolygonNodeProperties(star: star)
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
  
  /// Magic number needed for constructing path.
  static let PolygonConstant: CGFloat = 0.25
  
  func rebuildOutputs(frame: CGFloat) {
    let outerRadius = properties.outerRadius.value.cgFloatValue
    let outerRoundedness = properties.outerRoundedness.value.cgFloatValue * 0.01
    let numberOfPoints = properties.points.value.cgFloatValue
    let rotation = properties.rotation.value.cgFloatValue
    let position = properties.position.value.pointValue
  
    var currentAngle = (rotation - 90).toRadians()
    let anglePerPoint = ((2 * CGFloat.pi) / numberOfPoints)
    
    var point = CGPoint(x: (outerRadius * cos(currentAngle)),
                        y: (outerRadius * sin(currentAngle)))
    var vertices = [CurveVertex(point: point + position, inTangentRelative: .zero, outTangentRelative: .zero)]
    
    var previousPoint = point
    currentAngle += anglePerPoint;
    for _ in 0..<Int(ceil(numberOfPoints)) {
      previousPoint = point
      point = CGPoint(x: (outerRadius * cos(currentAngle)),
                      y: (outerRadius * sin(currentAngle)))
      
      if outerRoundedness != 0 {
        let cp1Theta = (atan2(previousPoint.y, previousPoint.x) - CGFloat.pi / 2)
        let cp1Dx = cos(cp1Theta);
        let cp1Dy = sin(cp1Theta);
        
        let cp2Theta = (atan2(point.y, point.x) - CGFloat.pi / 2)
        let cp2Dx = cos(cp2Theta)
        let cp2Dy = sin(cp2Theta)
        
        let cp1 = CGPoint(x: outerRadius * outerRoundedness * PolygonNode.PolygonConstant * cp1Dx,
                          y: outerRadius * outerRoundedness * PolygonNode.PolygonConstant * cp1Dy)
        let cp2 = CGPoint(x: outerRadius * outerRoundedness * PolygonNode.PolygonConstant * cp2Dx,
                          y: outerRadius * outerRoundedness * PolygonNode.PolygonConstant * cp2Dy)

        let previousVertex = vertices[vertices.endIndex-1]
        vertices[vertices.endIndex-1] = CurveVertex(previousVertex.inTangent, previousVertex.point, previousVertex.point - cp1 + position)
        vertices.append(CurveVertex(point: point + position, inTangentRelative: cp2, outTangentRelative: .zero))
      } else {
        vertices.append(CurveVertex(point: point + position, inTangentRelative: .zero, outTangentRelative: .zero))
      }
      currentAngle += anglePerPoint;
    }
    let reverse = properties.direction == .counterClockwise
    if reverse {
      vertices = vertices.reversed()
    }
    var path = BezierPath()
    for vertex in vertices {
      path.addVertex(reverse ? vertex.reversed() : vertex)
    }
    path.close()
    pathOutput.setPath(path, updateFrame: frame)
  }
  
}
