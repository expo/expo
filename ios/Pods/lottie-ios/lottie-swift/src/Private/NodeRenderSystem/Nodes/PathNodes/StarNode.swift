//
//  StarNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/21/19.
//

import Foundation
import QuartzCore

final class StarNodeProperties: NodePropertyMap, KeypathSearchable {
  
  var keypathName: String
  
  init(star: Star) {
    self.keypathName = star.name
    self.direction = star.direction
    self.position = NodeProperty(provider: KeyframeInterpolator(keyframes: star.position.keyframes))
    self.outerRadius = NodeProperty(provider: KeyframeInterpolator(keyframes: star.outerRadius.keyframes))
    self.outerRoundedness = NodeProperty(provider: KeyframeInterpolator(keyframes: star.outerRoundness.keyframes))
    if let innerRadiusKeyframes = star.innerRadius?.keyframes {
      self.innerRadius = NodeProperty(provider: KeyframeInterpolator(keyframes: innerRadiusKeyframes))
    } else {
      self.innerRadius = NodeProperty(provider: SingleValueProvider(Vector1D(0)))
    }
    if let innderRoundedness = star.innerRoundness?.keyframes {
      self.innerRoundedness = NodeProperty(provider: KeyframeInterpolator(keyframes: innderRoundedness))
    } else {
      self.innerRoundedness = NodeProperty(provider: SingleValueProvider(Vector1D(0)))
    }
    self.rotation = NodeProperty(provider: KeyframeInterpolator(keyframes: star.rotation.keyframes))
    self.points = NodeProperty(provider: KeyframeInterpolator(keyframes: star.points.keyframes))
    self.keypathProperties = [
      "Position" : position,
      "Outer Radius" : outerRadius,
      "Outer Roundedness" : outerRoundedness,
      "Inner Radius" : innerRadius,
      "Inner Roundedness" : innerRoundedness,
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
  let innerRadius: NodeProperty<Vector1D>
  let innerRoundedness: NodeProperty<Vector1D>
  let rotation: NodeProperty<Vector1D>
  let points: NodeProperty<Vector1D>
}

final class StarNode: AnimatorNode, PathNode {
  
  let properties: StarNodeProperties

  let pathOutput: PathOutputNode

  init(parentNode: AnimatorNode?, star: Star) {
    self.pathOutput = PathOutputNode(parent: parentNode?.outputNode)
    self.properties = StarNodeProperties(star: star)
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
  
  /// Magic number needed for building path data
  static let PolystarConstant: CGFloat = 0.47829
  
  func rebuildOutputs(frame: CGFloat) {
    let outerRadius = properties.outerRadius.value.cgFloatValue
    let innerRadius = properties.innerRadius.value.cgFloatValue
    let outerRoundedness = properties.outerRoundedness.value.cgFloatValue * 0.01
    let innerRoundedness = properties.innerRoundedness.value.cgFloatValue * 0.01
    let numberOfPoints = properties.points.value.cgFloatValue
    let rotation = properties.rotation.value.cgFloatValue
    let position = properties.position.value.pointValue
    
    var currentAngle = (rotation - 90).toRadians()
    let anglePerPoint = (2 * CGFloat.pi) / numberOfPoints
    let halfAnglePerPoint = anglePerPoint / 2.0
    let partialPointAmount = numberOfPoints - floor(numberOfPoints)
    
    var point: CGPoint = .zero
    
    var partialPointRadius: CGFloat = 0
    if partialPointAmount != 0 {
      currentAngle += halfAnglePerPoint * (1 - partialPointAmount)
      partialPointRadius = innerRadius + partialPointAmount * (outerRadius - innerRadius)
      point.x = (partialPointRadius * cos(currentAngle))
      point.y = (partialPointRadius * sin(currentAngle))
      currentAngle += anglePerPoint * partialPointAmount / 2
    } else {
      point.x = (outerRadius * cos(currentAngle))
      point.y = (outerRadius * sin(currentAngle))
      currentAngle += halfAnglePerPoint
    }
    
    var vertices = [CurveVertex]()
    vertices.append(CurveVertex(point: point + position, inTangentRelative: .zero, outTangentRelative: .zero))
    
    var previousPoint = point
    var longSegment = false
    let numPoints: Int = Int(ceil(numberOfPoints) * 2)
    for i in 0..<numPoints {
      var radius = longSegment ? outerRadius : innerRadius
      var dTheta = halfAnglePerPoint
      if partialPointRadius != 0 && i == numPoints - 2 {
        dTheta = anglePerPoint * partialPointAmount / 2
      }
      if partialPointRadius != 0 && i == numPoints - 1 {
        radius = partialPointRadius
      }
      previousPoint = point
      point.x = (radius * cos(currentAngle))
      point.y = (radius * sin(currentAngle))
      
      if innerRoundedness == 0 && outerRoundedness == 0 {
        vertices.append(CurveVertex(point: point + position, inTangentRelative: .zero, outTangentRelative: .zero))
      } else {
        let cp1Theta = (atan2(previousPoint.y, previousPoint.x) - CGFloat.pi / 2)
        let cp1Dx = cos(cp1Theta)
        let cp1Dy = sin(cp1Theta)
        
        let cp2Theta = (atan2(point.y, point.x) - CGFloat.pi / 2)
        let cp2Dx = cos(cp2Theta)
        let cp2Dy = sin(cp2Theta)
        
        let cp1Roundedness = longSegment ? innerRoundedness : outerRoundedness
        let cp2Roundedness = longSegment ? outerRoundedness : innerRoundedness
        let cp1Radius = longSegment ? innerRadius : outerRadius
        let cp2Radius = longSegment ? outerRadius : innerRadius
        
        var cp1 = CGPoint(x: cp1Radius * cp1Roundedness * StarNode.PolystarConstant * cp1Dx,
                          y: cp1Radius * cp1Roundedness * StarNode.PolystarConstant * cp1Dy)
        var cp2 = CGPoint(x: cp2Radius * cp2Roundedness * StarNode.PolystarConstant * cp2Dx,
                          y: cp2Radius * cp2Roundedness * StarNode.PolystarConstant * cp2Dy)
        if partialPointAmount != 0 {
          if i == 0 {
            cp1 = cp1 * partialPointAmount
          } else if i == numPoints - 1 {
            cp2 = cp2 * partialPointAmount
          }
        }
        let previousVertex = vertices[vertices.endIndex-1]
        vertices[vertices.endIndex-1] = CurveVertex(previousVertex.inTangent, previousVertex.point, previousVertex.point - cp1 + position)
        vertices.append(CurveVertex(point: point + position, inTangentRelative: cp2, outTangentRelative: .zero))
      }
      currentAngle += dTheta
      longSegment = !longSegment
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
