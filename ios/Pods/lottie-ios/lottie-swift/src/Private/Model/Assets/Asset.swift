//
//  Asset.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/9/19.
//

import Foundation

public class Asset: Codable {
  
  /// The ID of the asset
  public let id: String
  
  private enum CodingKeys : String, CodingKey {
    case id = "id"
  }
  
  required public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: Asset.CodingKeys.self)
    if let id = try? container.decode(String.self, forKey: .id) {
      self.id = id
    } else {
      self.id = String(try container.decode(Int.self, forKey: .id))
    }
  }
}
