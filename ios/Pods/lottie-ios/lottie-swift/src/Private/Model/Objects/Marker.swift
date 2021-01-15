//
//  Marker.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/9/19.
//

import Foundation

/// A time marker
final class Marker: Codable {
  
  /// The Marker Name
  let name: String
  
  /// The Frame time of the marker
  let frameTime: AnimationFrameTime
  
  enum CodingKeys : String, CodingKey {
    case name = "cm"
    case frameTime = "tm"
  }
}
