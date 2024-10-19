// Copyright 2024-present 650 Industries. All rights reserved.

import SDWebImage

/**
 An animated image resizer that adjusts an already loaded `SDAnimatedImage`.
 This is not a formal SDWebImage coder; it's used solely to leverage the SDWebImage loading pipeline.
 */
internal final class ResizedAnimatedCoder: NSObject, SDAnimatedImageCoder {
  private let actualCoder: SDAnimatedImageCoder
  private let size: CGSize
  private let scale: Double

  // swiftlint:disable:next unavailable_function
  init(animatedImageData data: Data?, options: [SDImageCoderOption: Any]? = nil) {
    fatalError("Unsupported initializer")
  }

  init(actualCoder: SDAnimatedImageCoder, size: CGSize, scale: Double) {
    self.actualCoder = actualCoder
    self.size = size
    self.scale = scale
    super.init()
  }

  // MARK: - SDImageCoder implementations

  func canDecode(from data: Data?) -> Bool {
    return actualCoder.canDecode(from: data)
  }

  func decodedImage(with data: Data?, options: [SDImageCoderOption: Any]? = nil) -> UIImage? {
    return actualCoder.decodedImage(with: data, options: options)
  }

  func canEncode(to format: SDImageFormat) -> Bool {
    return actualCoder.canEncode(to: format)
  }

  func encodedData(with image: UIImage?, format: SDImageFormat, options: [SDImageCoderOption: Any]? = nil) -> Data? {
    return actualCoder.encodedData(with: image, format: format, options: options)
  }

  // MARK: - SDAnimatedImageProvider implementations

  var animatedImageData: Data? {
    return actualCoder.animatedImageData
  }

  var animatedImageFrameCount: UInt {
    return actualCoder.animatedImageFrameCount
  }

  var animatedImageLoopCount: UInt {
    return actualCoder.animatedImageLoopCount
  }

  func animatedImageFrame(at index: UInt) -> UIImage? {
    guard let frame = actualCoder.animatedImageFrame(at: index) else {
      return nil
    }
    return resize(image: frame, toSize: self.size, scale: self.scale)
  }

  func animatedImageDuration(at index: UInt) -> TimeInterval {
    return actualCoder.animatedImageDuration(at: index)
  }
}
