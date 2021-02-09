//
//  StrokeNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/22/19.
//

import Foundation
import QuartzCore
// MARK: - Properties

final class StrokeNodeProperties: NodePropertyMap, KeypathSearchable {
  
  init(stroke: Stroke) {
    self.keypathName = stroke.name
    self.color = NodeProperty(provider: KeyframeInterpolator(keyframes: stroke.color.keyframes))
    self.opacity = NodeProperty(provider: KeyframeInterpolator(keyframes: stroke.opacity.keyframes))
    self.width = NodeProperty(provider: KeyframeInterpolator(keyframes: stroke.width.keyframes))
    self.miterLimit = CGFloat(stroke.miterLimit)
    self.lineCap = stroke.lineCap
    self.lineJoin = stroke.lineJoin
    
    if let dashes = stroke.dashPattern {
      var dashPatterns = ContiguousArray<ContiguousArray<Keyframe<Vector1D>>>()
      var dashPhase = ContiguousArray<Keyframe<Vector1D>>()
      for dash in dashes {
        if dash.type == .offset {
          dashPhase = dash.value.keyframes
        } else {
          dashPatterns.append(dash.value.keyframes)
        }
      }
      self.dashPattern = NodeProperty(provider: GroupInterpolator(keyframeGroups: dashPatterns))
      if dashPhase.count == 0 {
        self.dashPhase = NodeProperty(provider: SingleValueProvider(Vector1D(0)))
      } else {
        self.dashPhase = NodeProperty(provider: KeyframeInterpolator(keyframes: dashPhase))
      }
    } else {
      self.dashPattern = NodeProperty(provider: SingleValueProvider([Vector1D]()))
      self.dashPhase = NodeProperty(provider: SingleValueProvider(Vector1D(0)))
    }
    self.keypathProperties = [
      "Opacity" : opacity,
      "Color" : color,
      "Stroke Width" : width,
      "Dashes" : dashPattern,
      "Dash Phase" : dashPhase
    ]
    self.properties = Array(keypathProperties.values)
  }
  
  let keypathName: String
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
  
  let opacity: NodeProperty<Vector1D>
  let color: NodeProperty<Color>
  let width: NodeProperty<Vector1D>
  
  let dashPattern: NodeProperty<[Vector1D]>
  let dashPhase: NodeProperty<Vector1D>
  
  let lineCap: LineCap
  let lineJoin: LineJoin
  let miterLimit: CGFloat
  
}

// MARK: - Node

/// Node that manages stroking a path
final class StrokeNode: AnimatorNode, RenderNode {
  
  let strokeRender: StrokeRenderer
  var renderer: NodeOutput & Renderable {
    return strokeRender
  }
  
  let strokeProperties: StrokeNodeProperties
  
  init(parentNode: AnimatorNode?, stroke: Stroke) {
    self.strokeRender = StrokeRenderer(parent: parentNode?.outputNode)
    self.strokeProperties = StrokeNodeProperties(stroke: stroke)
    self.parentNode = parentNode
  }
  
  // MARK: Animator Node Protocol
  
  var propertyMap: NodePropertyMap & KeypathSearchable {
    return strokeProperties
  }
  
  let parentNode: AnimatorNode?
  var hasLocalUpdates: Bool = false
  var hasUpstreamUpdates: Bool = false
  var lastUpdateFrame: CGFloat? = nil
  var isEnabled: Bool = true {
    didSet {
      strokeRender.isEnabled = isEnabled
    }
  }
  
  func localUpdatesPermeateDownstream() -> Bool {
    return false
  }
  
  func rebuildOutputs(frame: CGFloat) {
    strokeRender.color = strokeProperties.color.value.cgColorValue
    strokeRender.opacity = strokeProperties.opacity.value.cgFloatValue * 0.01
    strokeRender.width = strokeProperties.width.value.cgFloatValue
    strokeRender.miterLimit = strokeProperties.miterLimit
    strokeRender.lineCap = strokeProperties.lineCap
    strokeRender.lineJoin = strokeProperties.lineJoin
    
    /// Get dash lengths
    let dashLengths = strokeProperties.dashPattern.value.map { $0.cgFloatValue }
    if dashLengths.count > 0 {
      strokeRender.dashPhase = strokeProperties.dashPhase.value.cgFloatValue
      strokeRender.dashLengths = dashLengths
    } else {
      strokeRender.dashLengths = nil
      strokeRender.dashPhase = nil
    }
  }
  
}
