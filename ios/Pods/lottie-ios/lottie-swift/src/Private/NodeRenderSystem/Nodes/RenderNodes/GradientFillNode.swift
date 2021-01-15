//
//  GradientFillNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/22/19.
//

import Foundation
import QuartzCore

final class GradientFillProperties: NodePropertyMap, KeypathSearchable {
  
  init(gradientfill: GradientFill) {
    self.keypathName = gradientfill.name
    self.opacity = NodeProperty(provider: KeyframeInterpolator(keyframes: gradientfill.opacity.keyframes))
    self.startPoint = NodeProperty(provider: KeyframeInterpolator(keyframes: gradientfill.startPoint.keyframes))
    self.endPoint = NodeProperty(provider: KeyframeInterpolator(keyframes: gradientfill.endPoint.keyframes))
    self.colors = NodeProperty(provider: KeyframeInterpolator(keyframes: gradientfill.colors.keyframes))
    self.gradientType = gradientfill.gradientType
    self.numberOfColors = gradientfill.numberOfColors
    self.keypathProperties = [
      "Opacity" : opacity,
      "Start Point" : startPoint,
      "End Point" : endPoint,
      "Colors" : colors
    ]
    self.properties = Array(keypathProperties.values)
  }
  
  var keypathName: String
  
  let opacity: NodeProperty<Vector1D>
  let startPoint: NodeProperty<Vector3D>
  let endPoint: NodeProperty<Vector3D>
  let colors: NodeProperty<[Double]>
  
  let gradientType: GradientType
  let numberOfColors: Int
  
  
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
  
}

final class GradientFillNode: AnimatorNode, RenderNode {
  
  let fillRender: GradientFillRenderer
  
  var renderer: NodeOutput & Renderable {
    return fillRender
  }
  
  let fillProperties: GradientFillProperties
  
  init(parentNode: AnimatorNode?, gradientFill: GradientFill) {
    self.fillRender = GradientFillRenderer(parent: parentNode?.outputNode)
    self.fillProperties = GradientFillProperties(gradientfill: gradientFill)
    self.parentNode = parentNode
  }
  
  // MARK: Animator Node Protocol
  
  var propertyMap: NodePropertyMap & KeypathSearchable {
    return fillProperties
  }
  
  let parentNode: AnimatorNode?
  var hasLocalUpdates: Bool = false
  var hasUpstreamUpdates: Bool = false
  var lastUpdateFrame: CGFloat? = nil
  var isEnabled: Bool = true {
    didSet {
      fillRender.isEnabled = isEnabled
    }
  }
  
  func localUpdatesPermeateDownstream() -> Bool {
    return false
  }
  
  func rebuildOutputs(frame: CGFloat) {
    fillRender.start = fillProperties.startPoint.value.pointValue
    fillRender.end = fillProperties.endPoint.value.pointValue
    fillRender.opacity = fillProperties.opacity.value.cgFloatValue * 0.01
    fillRender.colors = fillProperties.colors.value.map { CGFloat($0) }
    fillRender.type = fillProperties.gradientType
    fillRender.numberOfColors = fillProperties.numberOfColors
  }
}
