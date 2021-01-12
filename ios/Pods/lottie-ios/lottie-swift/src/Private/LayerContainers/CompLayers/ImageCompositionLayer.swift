//
//  ImageCompositionLayer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/25/19.
//

import Foundation
import CoreGraphics
import QuartzCore

final class ImageCompositionLayer: CompositionLayer {
  
  var image: CGImage? = nil {
    didSet {
      if let image = image {
        contentsLayer.contents = image
      } else {
        contentsLayer.contents = nil
      }
    }
  }
  
  let imageReferenceID: String
  
  init(imageLayer: ImageLayerModel, size: CGSize) {
    self.imageReferenceID = imageLayer.referenceID
    super.init(layer: imageLayer, size: size)
    contentsLayer.masksToBounds = true
    contentsLayer.contentsGravity = CALayerContentsGravity.resize
  }
  
  override init(layer: Any) {
    /// Used for creating shadow model layers. Read More here: https://developer.apple.com/documentation/quartzcore/calayer/1410842-init
    guard let layer = layer as? ImageCompositionLayer else {
      fatalError("init(layer:) Wrong Layer Class")
    }
    self.imageReferenceID = layer.imageReferenceID
    self.image = nil
    super.init(layer: layer)
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
}
