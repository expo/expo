// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore

/**
 Represents a single manipulate action. Only one field can be set.
 */
internal struct ManipulateAction: Record {
  @Field
  var resize: ResizeOptions?

  @Field
  var rotate: Double?

  @Field
  var flip: FlipType?

  @Field
  var crop: CropRect?
}

/**
 Options provided for resize action.
 */
internal struct ResizeOptions: Record {
  @Field
  var width: CGFloat?

  @Field
  var height: CGFloat?
}

/**
 Cropping rect for crop action.
 */
internal struct CropRect: Record {
  @Field
  var originX: Double = 0.0

  @Field
  var originY: Double = 0.0

  @Field
  var width: Double = 0.0

  @Field
  var height: Double = 0.0

  func toRect() -> CGRect {
    return CGRect(x: originX, y: originY, width: width, height: height)
  }
}

/**
 Options to use when saving the resulted image.
 */
internal struct ManipulateOptions: Record {
  @Field
  var base64: Bool = false

  @Field
  var compress: Double = 1.0

  @Field
  var format: ImageFormat = .jpeg
}

/**
 Possible options for flip action.
 */
internal enum FlipType: String, EnumArgument {
  case vertical
  case horizontal
}

/**
 Enum with supported image formats.
 */
internal enum ImageFormat: String, EnumArgument {
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
