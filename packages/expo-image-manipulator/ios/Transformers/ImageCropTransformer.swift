// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Transformer that creates a new image by cropping given image to specified width and height.
 */
internal struct ImageCropTransformer: ImageTransformer {
  let options: CropRect

  func transform(image: UIImage) async throws -> UIImage {
    let rect = options.toRect()
    let isOutOfBounds = rect.origin.x > image.size.width
    || rect.origin.y > image.size.height
    || rect.width > image.size.width
    || rect.height > image.size.height

    guard !isOutOfBounds else {
      throw ImageInvalidCropException()
    }
    guard let cgImage = image.cgImage?.cropping(to: rect) else {
      throw ImageCropFailedException(rect)
    }
    return UIImage(cgImage: cgImage, scale: image.scale, orientation: image.imageOrientation)
  }
}
