// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Transformer that draws a new image by resizing given image to specified size.
 */
internal struct ImageResizeTransformer: ImageTransformer {
  let options: ResizeOptions

  func transform(image: UIImage) async throws -> UIImage {
    let imageWidth = image.size.width
    let imageHeight = image.size.height
    let imageRatio = imageWidth / imageHeight

    var targetSize = CGSize.zero

    if let width = options.width {
      targetSize.width = width
      targetSize.height = width / imageRatio
    }
    if let height = options.height {
      targetSize.height = height
      targetSize.width = targetSize.width == 0 ? imageRatio * targetSize.height : targetSize.width
    }

    UIGraphicsBeginImageContextWithOptions(targetSize, false, 1.0)
    image.draw(in: CGRect(origin: .zero, size: targetSize))

    guard let newImage = UIGraphicsGetImageFromCurrentImageContext() else {
      UIGraphicsEndImageContext()
      throw NoImageInContextException()
    }

    UIGraphicsEndImageContext()
    return newImage
  }
}
