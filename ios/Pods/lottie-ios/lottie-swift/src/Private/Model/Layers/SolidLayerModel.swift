//
//  SolidLayer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/8/19.
//

import Foundation

/// A layer that holds a solid color.
final class SolidLayerModel: LayerModel {
  
  /// The color of the solid in Hex // Change to value provider.
  let colorHex: String
  
  /// The Width of the color layer
  let width: Double
  
  /// The height of the color layer
  let height: Double
  
  private enum CodingKeys : String, CodingKey {
    case colorHex = "sc"
    case width = "sw"
    case height = "sh"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: SolidLayerModel.CodingKeys.self)
    self.colorHex = try container.decode(String.self, forKey: .colorHex)
    self.width = try container.decode(Double.self, forKey: .width)
    self.height = try container.decode(Double.self, forKey: .height)
    try super.init(from: decoder)
  }
  
  override func encode(to encoder: Encoder) throws {
    try super.encode(to: encoder)
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(colorHex, forKey: .colorHex)
    try container.encode(width, forKey: .width)
    try container.encode(height, forKey: .height)
  }
  
}
