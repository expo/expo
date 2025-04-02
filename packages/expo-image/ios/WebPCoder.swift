// Copyright 2015-present 650 Industries. All rights reserved.

import SDWebImage
import SDWebImageWebPCoder

internal let imageCoderOptionUseAppleWebpCodec = SDImageCoderOption(rawValue: "useAppleWebpCodec")

/**
 A composite WebP coder that uses either `SDImageAWebPCoder` or `SDImageWebPCoder`
 based on the passed `imageCoderOptionUseAppleWebpCodec` option.
 */
internal final class WebPCoder: NSObject, SDAnimatedImageCoder {
  static let shared = WebPCoder()

  private var useAppleWebpCodec: Bool = true
  private var instantiatedCoder: SDAnimatedImageCoder?
  private var coder: SDAnimatedImageCoder {
    if let instantiatedCoder {
      return instantiatedCoder
    }
    return self.useAppleWebpCodec ? SDImageAWebPCoder.shared : SDImageWebPCoder.shared
  }

  override init() {
    super.init()
  }

  // MARK: - SDAnimatedImageCoder implementations

  convenience init(animatedImageData data: Data?, options: [SDImageCoderOption: Any]? = nil) {
    self.init()
    self.useAppleWebpCodec = options?[imageCoderOptionUseAppleWebpCodec] as? Bool ?? true
    self.instantiatedCoder = self.useAppleWebpCodec
      ? SDImageAWebPCoder.init(animatedImageData: data, options: options)
      : SDImageWebPCoder.init(animatedImageData: data, options: options)
  }

  func canDecode(from data: Data?) -> Bool {
    return self.coder.canDecode(from: data)
  }

  func decodedImage(with data: Data?, options: [SDImageCoderOption: Any]? = nil) -> UIImage? {
    return self.coder.decodedImage(with: data, options: options)
  }

  func canEncode(to format: SDImageFormat) -> Bool {
    return self.coder.canEncode(to: format)
  }

  func encodedData(with image: UIImage?, format: SDImageFormat, options: [SDImageCoderOption: Any]? = nil) -> Data? {
    return self.coder.encodedData(with: image, format: format, options: options)
  }

  var animatedImageData: Data? {
    return self.coder.animatedImageData
  }

  var animatedImageFrameCount: UInt {
    return self.coder.animatedImageFrameCount
  }

  var animatedImageLoopCount: UInt {
    return self.coder.animatedImageLoopCount
  }

  func animatedImageFrame(at index: UInt) -> UIImage? {
    return self.coder.animatedImageFrame(at: index)
  }

  func animatedImageDuration(at index: UInt) -> TimeInterval {
    return self.coder.animatedImageDuration(at: index)
  }
}
