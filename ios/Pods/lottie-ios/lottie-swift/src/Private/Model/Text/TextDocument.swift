//
//  TextDocument.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/9/19.
//

import Foundation

enum TextJustification: Int, Codable {
  case left
  case right
  case center
}

final class TextDocument: Codable {
  
  /// The Text
  let text: String
  
  /// The Font size
  let fontSize: Double
  
  /// The Font Family
  let fontFamily: String
  
  /// Justification
  let justification: TextJustification
  
  /// Tracking
  let tracking: Int
  
  /// Line Height
  let lineHeight: Double
  
  /// Baseline
  let baseline: Double?
  
  /// Fill Color data
  let fillColorData: Color?
  
  /// Scroke Color data
  let strokeColorData: Color?
  
  /// Stroke Width
  let strokeWidth: Double?
  
  /// Stroke Over Fill
  let strokeOverFill: Bool?
  
  let textFramePosition: Vector3D?
  
  let textFrameSize: Vector3D?
  
  private enum CodingKeys : String, CodingKey {
    case text = "t"
    case fontSize = "s"
    case fontFamily = "f"
    case justification = "j"
    case tracking = "tr"
    case lineHeight = "lh"
    case baseline = "ls"
    case fillColorData = "fc"
    case strokeColorData = "sc"
    case strokeWidth = "sw"
    case strokeOverFill = "of"
    case textFramePosition = "ps"
    case textFrameSize = "sz"
  }
}
