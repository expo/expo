//
//  NullCompositionLayer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/25/19.
//

import Foundation

final class NullCompositionLayer: CompositionLayer {
  
  init(layer: LayerModel) {
    super.init(layer: layer, size: .zero)
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override init(layer: Any) {
    /// Used for creating shadow model layers. Read More here: https://developer.apple.com/documentation/quartzcore/calayer/1410842-init
    guard let layer = layer as? NullCompositionLayer else {
      fatalError("init(layer:) Wrong Layer Class")
    }
    super.init(layer: layer)
  }
  
}
