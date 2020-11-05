//
//  GroupNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/18/19.
//

import Foundation
import QuartzCore
import CoreGraphics

final class GroupNodeProperties: NodePropertyMap, KeypathSearchable {
  
  var keypathName: String = "Transform"
  
  var childKeypaths: [KeypathSearchable] = []
  
  init(transform: ShapeTransform?) {
    if let transform = transform {
      self.anchor = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.anchor.keyframes))
      self.position = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.position.keyframes))
      self.scale = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.scale.keyframes))
      self.rotation = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.rotation.keyframes))
      self.opacity = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.opacity.keyframes))
      self.skew = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.skew.keyframes))
      self.skewAxis = NodeProperty(provider: KeyframeInterpolator(keyframes: transform.skewAxis.keyframes))
    } else {
      /// Transform node missing. Default to empty transform.
      self.anchor = NodeProperty(provider: SingleValueProvider(Vector3D(x: CGFloat(0), y: CGFloat(0), z: CGFloat(0))))
      self.position = NodeProperty(provider: SingleValueProvider(Vector3D(x: CGFloat(0), y: CGFloat(0), z: CGFloat(0))))
      self.scale = NodeProperty(provider: SingleValueProvider(Vector3D(x: CGFloat(1), y: CGFloat(1), z: CGFloat(1))))
      self.rotation = NodeProperty(provider: SingleValueProvider(Vector1D(0)))
      self.opacity = NodeProperty(provider: SingleValueProvider(Vector1D(1)))
      self.skew = NodeProperty(provider: SingleValueProvider(Vector1D(0)))
      self.skewAxis = NodeProperty(provider: SingleValueProvider(Vector1D(0)))
    }
    self.keypathProperties = [
      "Anchor Point" : anchor,
      "Position" : position,
      "Scale" : scale,
      "Rotation" : rotation,
      "Opacity" : opacity,
      "Skew" : skew,
      "Skew Axis" : skewAxis
    ]
    self.properties = Array(keypathProperties.values)
  }
  
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
  
  let anchor: NodeProperty<Vector3D>
  let position: NodeProperty<Vector3D>
  let scale: NodeProperty<Vector3D>
  let rotation: NodeProperty<Vector1D>
  let opacity: NodeProperty<Vector1D>
  let skew: NodeProperty<Vector1D>
  let skewAxis: NodeProperty<Vector1D>
  
  var caTransform: CATransform3D {
    return CATransform3D.makeTransform(anchor: anchor.value.pointValue,
                                       position: position.value.pointValue,
                                       scale: scale.value.sizeValue,
                                       rotation: rotation.value.cgFloatValue,
                                       skew: skew.value.cgFloatValue,
                                       skewAxis: skewAxis.value.cgFloatValue)
  }
}

final class GroupNode: AnimatorNode {
  
  // MARK: Properties
  let groupOutput: GroupOutputNode
  
  let properties: GroupNodeProperties

  let rootNode: AnimatorNode?
  
  var container: ShapeContainerLayer = ShapeContainerLayer()

  // MARK: Initializer
  init(name: String, parentNode: AnimatorNode?, tree: NodeTree) {
    self.parentNode = parentNode
    self.keypathName = name
    self.rootNode = tree.rootNode
    self.properties = GroupNodeProperties(transform: tree.transform)
    self.groupOutput = GroupOutputNode(parent: parentNode?.outputNode, rootNode: rootNode?.outputNode)
    var childKeypaths: [KeypathSearchable] = tree.childrenNodes
    childKeypaths.append(properties)
    self.childKeypaths = childKeypaths
    
    for childContainer in tree.renderContainers {
      container.insertRenderLayer(childContainer)
    }
  }
  
  // MARK: Keypath Searchable
  
  let keypathName: String
  
  let childKeypaths: [KeypathSearchable]
  
  var keypathLayer: CALayer? {
    return container
  }
  
  // MARK: Animator Node Protocol
  
  var propertyMap: NodePropertyMap & KeypathSearchable {
    return properties
  }
  
  var outputNode: NodeOutput {
    return groupOutput
  }
  
  let parentNode: AnimatorNode?
  var hasLocalUpdates: Bool = false
  var hasUpstreamUpdates: Bool = false
  var lastUpdateFrame: CGFloat? = nil
  var isEnabled: Bool = true {
    didSet {
      container.isHidden = !isEnabled
    }
  }
  
  func performAdditionalLocalUpdates(frame: CGFloat, forceLocalUpdate: Bool) -> Bool {
    return rootNode?.updateContents(frame, forceLocalUpdate: forceLocalUpdate) ?? false
  }
  
  func performAdditionalOutputUpdates(_ frame: CGFloat, forceOutputUpdate: Bool) {
    rootNode?.updateOutputs(frame, forceOutputUpdate: forceOutputUpdate)
  }
  
  func rebuildOutputs(frame: CGFloat) {
    container.opacity = Float(properties.opacity.value.cgFloatValue) * 0.01
    container.transform = properties.caTransform
    groupOutput.setTransform(container.transform, forFrame: frame)
  }
  
}
