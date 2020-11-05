//
//  TextAnimator.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/9/19.
//

import Foundation

final class TextAnimator: Codable {
  
  let name: String
  
  /// Anchor
  let anchor: KeyframeGroup<Vector3D>?
  
  /// Position
  let position: KeyframeGroup<Vector3D>?
  
  /// Scale
  let scale: KeyframeGroup<Vector3D>?
  
  /// Skew
  let skew: KeyframeGroup<Vector1D>?
  
  /// Skew Axis
  let skewAxis: KeyframeGroup<Vector1D>?
  
  /// Rotation
  let rotation: KeyframeGroup<Vector1D>?
  
  /// Opacity
  let opacity: KeyframeGroup<Vector1D>?
  
  /// Stroke Color
  let strokeColor: KeyframeGroup<Color>?
  
  /// Fill Color
  let fillColor: KeyframeGroup<Color>?
  
  /// Stroke Width
  let strokeWidth: KeyframeGroup<Vector1D>?
  
  /// Tracking
  let tracking: KeyframeGroup<Vector1D>?
  
  private enum CodingKeys: String, CodingKey {
//    case textSelector = "s" TODO
    case textAnimator = "a"
    case name = "nm"
  }
  
  private enum TextSelectorKeys: String, CodingKey {
    case start = "s"
    case end = "e"
    case offset = "o"
  }
  
  private enum TextAnimatorKeys: String, CodingKey {
    case fillColor = "fc"
    case strokeColor = "sc"
    case strokeWidth = "sw"
    case tracking = "t"
    case anchor = "a"
    case position = "p"
    case scale = "s"
    case skew = "sk"
    case skewAxis = "sa"
    case rotation = "r"
    case opacity = "o"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: TextAnimator.CodingKeys.self)
    self.name = try container.decodeIfPresent(String.self, forKey: .name) ?? ""
    let animatorContainer = try container.nestedContainer(keyedBy: TextAnimatorKeys.self, forKey: .textAnimator)
    self.fillColor = try animatorContainer.decodeIfPresent(KeyframeGroup<Color>.self, forKey: .fillColor)
    self.strokeColor = try animatorContainer.decodeIfPresent(KeyframeGroup<Color>.self, forKey: .strokeColor)
    self.strokeWidth = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .strokeWidth)
    self.tracking = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .tracking)
    self.anchor = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector3D>.self, forKey: .anchor)
    self.position = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector3D>.self, forKey: .position)
    self.scale = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector3D>.self, forKey: .scale)
    self.skew = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .skew)
    self.skewAxis = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .skewAxis)
    self.rotation = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .rotation)
    self.opacity = try animatorContainer.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .opacity)
    
  }
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    var animatorContainer = container.nestedContainer(keyedBy: TextAnimatorKeys.self, forKey: .textAnimator)
    try animatorContainer.encodeIfPresent(fillColor, forKey: .fillColor)
    try animatorContainer.encodeIfPresent(strokeColor, forKey: .strokeColor)
    try animatorContainer.encodeIfPresent(strokeWidth, forKey: .strokeWidth)
    try animatorContainer.encodeIfPresent(tracking, forKey: .tracking)
  }
}
