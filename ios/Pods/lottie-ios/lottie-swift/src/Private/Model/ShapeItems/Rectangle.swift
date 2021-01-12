//
//  Rectangle.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/8/19.
//

import Foundation

/// An item that define an ellipse shape
final class Rectangle: ShapeItem {
  
  /// The direction of the rect.
  let direction: PathDirection
  
  /// The position
  let position: KeyframeGroup<Vector3D>
  
  /// The size
  let size: KeyframeGroup<Vector3D>
  
  /// The Corner radius of the rectangle
  let cornerRadius: KeyframeGroup<Vector1D>
  
  private enum CodingKeys : String, CodingKey {
    case direction = "d"
    case position = "p"
    case size = "s"
    case cornerRadius = "r"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: Rectangle.CodingKeys.self)
    self.direction = try container.decodeIfPresent(PathDirection.self, forKey: .direction) ?? .clockwise
    self.position = try container.decode(KeyframeGroup<Vector3D>.self, forKey: .position)
    self.size = try container.decode(KeyframeGroup<Vector3D>.self, forKey: .size)
    self.cornerRadius = try container.decode(KeyframeGroup<Vector1D>.self, forKey: .cornerRadius)
    try super.init(from: decoder)
  }
  
  override func encode(to encoder: Encoder) throws {
    try super.encode(to: encoder)
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(direction, forKey: .direction)
    try container.encode(position, forKey: .position)
    try container.encode(size, forKey: .size)
    try container.encode(cornerRadius, forKey: .cornerRadius)
  }
  
}
