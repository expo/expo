//
//  ImageAsset.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/9/19.
//

import Foundation

public final class ImageAsset: Asset {
  
  /// Image name
  public let name: String
  
  /// Image Directory
  public let directory: String
  
  /// Image Size
  public let width: Double
  
  public let height: Double
  
  enum CodingKeys : String, CodingKey {
    case name = "p"
    case directory = "u"
    case width = "w"
    case height = "h"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: ImageAsset.CodingKeys.self)
    self.name = try container.decode(String.self, forKey: .name)
    self.directory = try container.decode(String.self, forKey: .directory)
    self.width = try container.decode(Double.self, forKey: .width)
    self.height = try container.decode(Double.self, forKey: .height)
    try super.init(from: decoder)
  }
  
  override public func encode(to encoder: Encoder) throws {
    try super.encode(to: encoder)
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(name, forKey: .name)
    try container.encode(directory, forKey: .directory)
    try container.encode(width, forKey: .width)
    try container.encode(height, forKey: .height)
  }

}
