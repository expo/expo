// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Transformer that makes sure the image is oriented up and not mirrored.
 Guarantees that the original pixel data matches the displayed orientation.
 */
internal struct ImageFixOrientationTransformer: ImageTransformer {
  func transform(image: UIImage) async throws -> UIImage {
    guard let cgImage = image.cgImage else {
      throw ImageNotFoundException()
    }
    guard var colorSpace = cgImage.colorSpace else {
      // That should never happen as `colorSpace` is empty only when the image is a mask.
      throw ImageColorSpaceNotFoundException()
    }
    if !colorSpace.supportsOutput {
      colorSpace = CGColorSpaceCreateDeviceRGB()
    }

    var transform = CGAffineTransform.identity

    switch image.imageOrientation {
    case .down, .downMirrored:
      transform = transform.translatedBy(x: image.size.width, y: image.size.height)
      transform = transform.rotated(by: Double.pi)
    case .left, .leftMirrored:
      transform = transform.translatedBy(x: image.size.width, y: 0)
      transform = transform.rotated(by: Double.pi / 2)
    case .right, .rightMirrored:
      transform = transform.translatedBy(x: 0, y: image.size.height)
      transform = transform.rotated(by: -Double.pi / 2)
    default:
      break
    }

    switch image.imageOrientation {
    case .upMirrored, .downMirrored:
      transform = transform.translatedBy(x: image.size.width, y: 0)
      transform = transform.scaledBy(x: -1, y: 1)
    case .leftMirrored, .rightMirrored:
      transform = transform.translatedBy(x: image.size.height, y: 0)
      transform = transform.scaledBy(x: -1, y: 1)
    default:
      break
    }

    func makeContext(bitsPerComponent: Int, colorSpace: CGColorSpace) -> CGContext? {
      return CGContext(
        data: nil,
        width: Int(image.size.width),
        height: Int(image.size.height),
        bitsPerComponent: bitsPerComponent,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      )
    }

    // A `CGContext` accepts only a fixed set of pixel formats, and a decoded image's own
    // format is not always among them: a 10-bit HDR HEIC decodes to `bitsPerComponent == 10`,
    // which has no context equivalent, so a file that decoded perfectly well yields no
    // context at all. Widening to 16 keeps the image's colour space and every bit of its
    // precision; the 8-bit device RGB last resort covers a colour space that is rejected as
    // a drawing destination even though it reports `supportsOutput`, as the extended-range
    // ones do.
    let context = makeContext(bitsPerComponent: cgImage.bitsPerComponent, colorSpace: colorSpace)
      ?? makeContext(bitsPerComponent: 16, colorSpace: colorSpace)
      ?? makeContext(bitsPerComponent: 8, colorSpace: CGColorSpaceCreateDeviceRGB())

    guard let context = context else {
      throw ImageContextLostException()
    }

    context.concatenate(transform)

    switch image.imageOrientation {
    case .left, .leftMirrored, .right, .rightMirrored:
      context.draw(cgImage, in: CGRect(x: 0, y: 0, width: image.size.height, height: image.size.width))
    default:
      context.draw(cgImage, in: CGRect(x: 0, y: 0, width: image.size.width, height: image.size.height))
    }

    guard let newCGImage = context.makeImage() else {
      throw ImageDrawingFailedException()
    }
    return UIImage(cgImage: newCGImage)
  }
}
