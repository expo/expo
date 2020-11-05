//
//  FillShape.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/8/19.
//

import Foundation

enum FillRule: Int, Codable {
  case none
  case nonZeroWinding
  case evenOdd
}

/// An item that defines a fill render
final class Fill: ShapeItem {
  
  /// The opacity of the fill
  let opacity: KeyframeGroup<Vector1D>
  
  /// The color keyframes for the fill
  let color: KeyframeGroup<Color>
  
  let fillRule: FillRule
  
  private enum CodingKeys : String, CodingKey {
    case opacity = "o"
    case color = "c"
    case fillRule = "r"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: Fill.CodingKeys.self)
    self.opacity = try container.decode(KeyframeGroup<Vector1D>.self, forKey: .opacity)
    self.color = try container.decode(KeyframeGroup<Color>.self, forKey: .color)
    self.fillRule = try container.decodeIfPresent(FillRule.self, forKey: .fillRule) ?? .nonZeroWinding
    try super.init(from: decoder)
  }
  
  override func encode(to encoder: Encoder) throws {
    try super.encode(to: encoder)
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(opacity, forKey: .opacity)
    try container.encode(color, forKey: .color)
    try container.encode(fillRule, forKey: .fillRule)
  }
  
}
