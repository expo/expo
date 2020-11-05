//
//  Mask.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/8/19.
//

import Foundation

enum MaskMode: String, Codable {
  case add = "a"
  case subtract = "s"
  case intersect = "i"
  case lighten = "l"
  case darken = "d"
  case difference = "f"
  case none = "n"
}

final class Mask: Codable {
  
  let mode: MaskMode
  
  let opacity: KeyframeGroup<Vector1D>
  
  let shape: KeyframeGroup<BezierPath>
  
  let inverted: Bool
  
  let expansion: KeyframeGroup<Vector1D>
  
  enum CodingKeys : String, CodingKey {
    case mode = "mode"
    case opacity = "o"
    case inverted = "inv"
    case shape = "pt"
    case expansion = "x"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: Mask.CodingKeys.self)
    self.mode = try container.decodeIfPresent(MaskMode.self, forKey: .mode) ?? .add
    self.opacity = try container.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .opacity) ?? KeyframeGroup(Vector1D(100))
    self.shape = try container.decode(KeyframeGroup<BezierPath>.self, forKey: .shape)
    self.inverted = try container.decodeIfPresent(Bool.self, forKey: .inverted) ?? false
    self.expansion = try container.decodeIfPresent(KeyframeGroup<Vector1D>.self, forKey: .expansion) ?? KeyframeGroup(Vector1D(0))
  }
}
