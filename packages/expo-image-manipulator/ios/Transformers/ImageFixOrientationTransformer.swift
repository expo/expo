// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Transformer that makes sure the image is oriented up and not mirrored.
 Guarantees that the original pixel data matches the displayed orientation.
 */
internal struct ImageFixOrientationTransformer: ImageTransformer {
  func transform(image: UIImage) async throws -> UIImage {
    guard image.cgImage != nil else {
      throw ImageNotFoundException()
    }
    // The pixel data already matches the displayed orientation, so there is nothing to fix.
    guard image.imageOrientation != .up else {
      return image
    }
    // `UIImage.draw(in:)` applies the orientation on its own.
    // Unlike a raw bitmap context, the renderer accepts any source pixel format,
    // including the 10-bit HDR images that `CGBitmapContextCreate` rejects.
    return drawInNewContext(size: image.size) { _ in
      image.draw(in: CGRect(origin: .zero, size: image.size))
    }
  }
}
