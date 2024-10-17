// Copyright 2024-present 650 Industries. All rights reserved.

import SDWebImage

/**
 An animated image resizer that adjusts an already loaded `SDAnimatedImage`.
 This is not a formal SDWebImage coder; it's used solely to leverage the SDWebImage loading pipeline.
 */
internal final class ResizedAnimatedCoder: SDImageIOAnimatedCoder {
  private let image: SDAnimatedImage
  private let size: CGSize
  private let scale: Double

  @available(*, unavailable)
  required init(incrementalWithOptions options: [SDImageCoderOption: Any]? = nil) {
    fatalError("Unsupported initializer")
  }

  @available(*, unavailable)
  required init(animatedImageData: Data?, options: [SDImageCoderOption: Any]? = nil) {
    fatalError("Unsupported initializer")
  }

  init(image: SDAnimatedImage, size: CGSize, scale: Double) {
    self.image = image
    self.size = size
    self.scale = scale
    super.init()
  }

  override func animatedImageFrame(at index: UInt) -> UIImage? {
    guard let frame = image.animatedImageFrame(at: index) else {
      return nil
    }
    return resize(image: frame, toSize: self.size, scale: self.scale)
  }

  override var animatedImageLoopCount: UInt {
    return image.animatedImageLoopCount
  }

  override var animatedImageFrameCount: UInt {
    return image.animatedImageFrameCount
  }

  override func animatedImageDuration(at index: UInt) -> TimeInterval {
    return image.animatedImageDuration(at: index)
  }
}
