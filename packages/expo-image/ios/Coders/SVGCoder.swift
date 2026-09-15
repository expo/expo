// Copyright 2026-present 650 Industries. All rights reserved.

internal import SDWebImage
internal import SDWebImageSVGCoder

/// The SVG coder used on the normal load path. It resolves `var()` references to their fallbacks
/// before handing the document to `SDImageSVGCoder`, because CoreSVG can't resolve custom properties
/// itself and would otherwise render such a document with missing fills and strokes.
///
/// Sources with `svgVariables` set also pass through here, but the view discards that image and
/// decodes the document again with the supplied values substituted. For that it needs the original
/// document, which the manager doesn't deliver on a memory hit or for a transformed image, so images
/// decoded from a document that uses `var()` carry it as their extended object. See `ImageView`.
internal final class SVGCoder: NSObject, SDImageCoder {
  nonisolated(unsafe) static let shared = SVGCoder()

  private let coder = SDImageSVGCoder.shared

  func canDecode(from data: Data?) -> Bool {
    return coder.canDecode(from: data)
  }

  func decodedImage(with data: Data?, options: [SDImageCoderOption: Any]? = nil) -> UIImage? {
    guard let data, let image = coder.decodedImage(with: SVGVariables.resolveFallbacks(in: data), options: options) else {
      return nil
    }
    if SVGVariables.usesVariables(data) {
      // The extended object has to be an `NSCoding` object.
      // swiftlint:disable:next legacy_objc_type
      image.sd_extendedObject = data as NSData
    }
    return image
  }

  func canEncode(to format: SDImageFormat) -> Bool {
    return coder.canEncode(to: format)
  }

  func encodedData(with image: UIImage?, format: SDImageFormat, options: [SDImageCoderOption: Any]? = nil) -> Data? {
    return coder.encodedData(with: image, format: format, options: options)
  }
}
