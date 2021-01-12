//
//  Layer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/7/19.
//

import Foundation

/// Used for mapping a heterogeneous list to classes for parsing.
extension LayerType: ClassFamily {
  static var discriminator: Discriminator = .type
  
  func getType() -> AnyObject.Type {
    switch self {
    case .precomp:
      return PreCompLayerModel.self
    case .solid:
      return SolidLayerModel.self
    case .image:
      return ImageLayerModel.self
    case .null:
      return LayerModel.self
    case .shape:
      return ShapeLayerModel.self
    case .text:
      return TextLayerModel.self
    }
  }
}

public enum LayerType: Int, Codable {
  case precomp
  case solid
  case image
  case null
  case shape
  case text
  
  public init(from decoder: Decoder) throws {
    self = try LayerType(rawValue: decoder.singleValueContainer().decode(RawValue.self)) ?? .null
  }
}

public enum MatteType: Int, Codable {
  case none
  case add
  case invert
  case unknown
}

public enum BlendMode: Int, Codable {
  case normal
  case multiply
  case screen
  case overlay
  case darken
  case lighten
  case colorDodge
  case colorBurn
  case hardLight
  case softLight
  case difference
  case exclusion
  case hue
  case saturation
  case color
  case luminosity
}

/**
 A base top container for shapes, images, and other view objects.
 */
class LayerModel: Codable {
  
  /// The readable name of the layer
  let name: String
  
  /// The index of the layer
  let index: Int
  
  /// The type of the layer.
  let type: LayerType
  
  /// The coordinate space
  let coordinateSpace: CoordinateSpace
  
  /// The in time of the layer in frames.
  let inFrame: Double
  /// The out time of the layer in frames.
  let outFrame: Double
  
  /// The start time of the layer in frames.
  let startTime: Double
  
  /// The transform of the layer
  let transform: Transform
  
  /// The index of the parent layer, if applicable.
  let parent: Int?
  
  /// The blending mode for the layer
  let blendMode: BlendMode
  
  /// An array of masks for the layer.
  let masks: [Mask]?
  
  /// A number that stretches time by a multiplier
  let timeStretch: Double
  
  /// The type of matte if any.
  let matte: MatteType?
  
  let hidden: Bool
  
  private enum CodingKeys : String, CodingKey {
    case name = "nm"
    case index = "ind"
    case type = "ty"
    case coordinateSpace = "ddd"
    case inFrame = "ip"
    case outFrame = "op"
    case startTime = "st"
    case transform = "ks"
    case parent = "parent"
    case blendMode = "bm"
    case masks = "masksProperties"
    case timeStretch = "sr"
    case matte = "tt"
    case hidden = "hd"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: LayerModel.CodingKeys.self)
    self.name = try container.decodeIfPresent(String.self, forKey: .name) ?? "Layer"
    self.index = try container.decode(Int.self, forKey: .index)
    self.type = try container.decode(LayerType.self, forKey: .type)
    self.coordinateSpace = try container.decodeIfPresent(CoordinateSpace.self, forKey: .coordinateSpace) ?? .type2d
    self.inFrame = try container.decode(Double.self, forKey: .inFrame)
    self.outFrame = try container.decode(Double.self, forKey: .outFrame)
    self.startTime = try container.decode(Double.self, forKey: .startTime)
    self.transform = try container.decode(Transform.self, forKey: .transform)
    self.parent = try container.decodeIfPresent(Int.self, forKey: .parent)
    self.blendMode = try container.decodeIfPresent(BlendMode.self, forKey: .blendMode) ?? .normal
    self.masks = try container.decodeIfPresent([Mask].self, forKey: .masks)
    self.timeStretch = try container.decodeIfPresent(Double.self, forKey: .timeStretch) ?? 1
    self.matte = try container.decodeIfPresent(MatteType.self, forKey: .matte)
    self.hidden = try container.decodeIfPresent(Bool.self, forKey: .hidden) ?? false
  }
}
