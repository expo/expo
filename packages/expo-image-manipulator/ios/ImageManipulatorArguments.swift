// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore
import UIKit

/// The source image: a URL or a reference to an already loaded image.
@Union
internal enum ImageSource {
  case url(URL)
  case image(SharedRef<UIImage>)
}

/// Options for loading the source image.
@Record
internal struct ImageLoadOptions {
  var maxWidth: Int?
  var maxHeight: Int?
}

/// Options provided for resize action.
@Record
internal struct ResizeOptions {
  var width: CGFloat?
  var height: CGFloat?
}

/// Cropping rect for crop action.
@Record
internal struct CropRect {
  var originX: Double = 0.0
  var originY: Double = 0.0
  var width: Double = 0.0
  var height: Double = 0.0

  func toRect() -> CGRect {
    return CGRect(x: originX, y: originY, width: width, height: height)
  }
}

/// Options to use when saving the resulted image.
@Record
internal struct ManipulateOptions {
  var base64: Bool = false
  var compress: Double = 1.0
  var format: ImageFormat = .jpeg
}

/// The saved image file, returned to JavaScript.
@Record
internal struct ImageResult {
  var uri: String
  var width: Int
  var height: Int
  var base64: String?
}

/// Possible options for flip action.
internal enum FlipType: String, Enumerable {
  case vertical
  case horizontal
}

/// Enum with supported image formats.
internal enum ImageFormat: String, Enumerable {
  case jpeg
  case jpg
  case png
  case webp

  var fileExtension: String {
    switch self {
    case .jpeg, .jpg:
      return ".jpg"
    case .png:
      return ".png"
    case .webp:
      return ".webp"
    }
  }
}
