//
//  TextLayer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/8/19.
//

import Foundation

/// A layer that holds text.
final class TextLayerModel: LayerModel {

  /// The text for the layer
  let text: KeyframeGroup<TextDocument>
  
  /// Text animators
  let animators: [TextAnimator]
  
  private enum CodingKeys : String, CodingKey {
    case textGroup = "t"
  }
  
  private enum TextCodingKeys : String, CodingKey {
    case text = "d"
    case animators = "a"
  }
  
  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: TextLayerModel.CodingKeys.self)
    let textContainer = try container.nestedContainer(keyedBy: TextCodingKeys.self, forKey: .textGroup)
    self.text = try textContainer.decode(KeyframeGroup<TextDocument>.self, forKey: .text)
    self.animators = try textContainer.decode([TextAnimator].self, forKey: .animators)
    try super.init(from: decoder)
  }
  
  override func encode(to encoder: Encoder) throws {
    try super.encode(to: encoder)
    var container = encoder.container(keyedBy: CodingKeys.self)
    var textContainer = container.nestedContainer(keyedBy: TextCodingKeys.self, forKey: .textGroup)
    try textContainer.encode(text, forKey: .text)
    try textContainer.encode(animators, forKey: .animators)
  }
  
}
