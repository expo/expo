// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Transformer that makes sure the image is oriented up and not mirrored.
 Guarantees that the original pixel data matches the displayed orientation and that image size is in pixels.
 */
internal struct ImageFixOrientationTransformer: ImageTransformer {
  func transform(image: UIImage) async throws -> UIImage {
    guard let cgImage = image.cgImage else {
      throw ImageNotFoundException()
    }
    // Upright pixels need no redraw. Normalize the scale to pixel coordinates.
    guard image.imageOrientation != .up else {
      return image.scale == 1 ? image : UIImage(cgImage: cgImage)
    }
    // `draw(in:)` applies the orientation. The renderer accepts 10-bit HDR sources that `CGContext` rejects.
    let size = CGSize(width: image.size.width * image.scale, height: image.size.height * image.scale)
    return drawInNewContext(size: size) { _ in
      image.draw(in: CGRect(origin: .zero, size: size))
    }
  }
}
