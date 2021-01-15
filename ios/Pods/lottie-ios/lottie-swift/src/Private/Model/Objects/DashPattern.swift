//
//  DashPattern.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/22/19.
//

import Foundation

enum DashElementType: String, Codable {
  case offset = "o"
  case dash = "d"
  case gap = "g"
}

final class DashElement: Codable {
  let type: DashElementType
  let value: KeyframeGroup<Vector1D>
  
  enum CodingKeys : String, CodingKey {
    case type = "n"
    case value = "v"
  }
}
