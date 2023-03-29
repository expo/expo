// Copyright 2021-present 650 Industries. All rights reserved.

import UIKit

/**
 Main `manipulate` function that takes an array of any supported actions to apply.
 */
internal func manipulate(image initialImage: UIImage, actions: [ManipulateAction]) throws -> UIImage {
  var image: UIImage = initialImage

  image = try fixImageOrientation(image)

  for action in actions {
    if let resize = action.resize {
      image = try manipulate(image: image, resize: resize)
    } else if let rotate = action.rotate {
      image = try manipulate(image: image, rotate: rotate)
    } else if let flip = action.flip {
      image = try manipulate(image: image, flip: flip)
    } else if let crop = action.crop {
      image = try manipulate(image: image, crop: crop)
    }
  }
  return image
}

/**
 Draws a new image by resizing given image to specified size.
 */
internal func manipulate(image: UIImage, resize: ResizeOptions) throws -> UIImage {
  let imageWidth = image.size.width
  let imageHeight = image.size.height
  let imageRatio = imageWidth / imageHeight

  var targetSize = CGSize.zero

  if let width = resize.width {
    targetSize.width = width
    targetSize.height = width / imageRatio
  }
  if let height = resize.height {
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

/**
 Creates a new image by rotating given image by the rotate angle.
 */
internal func manipulate(image: UIImage, rotate: Double) throws -> UIImage {
  guard let cgImage = image.cgImage else {
    throw ImageNotFoundException()
  }
  let rads = rotate * Double.pi / 180
  let rotatedView = UIView(frame: CGRect(origin: .zero, size: image.size))

  rotatedView.transform = CGAffineTransform(rotationAngle: rads)

  let rotatedSize = CGSize(width: rotatedView.frame.size.width.rounded(.down), height: rotatedView.frame.size.height.rounded(.down))
  let origin = CGPoint(x: -image.size.width / 2, y: -image.size.height / 2)

  return try drawInNewContext(size: rotatedSize) { context in
    context.translateBy(x: rotatedSize.width / 2, y: rotatedSize.height / 2)
    context.rotate(by: rads)
    context.scaleBy(x: 1.0, y: -1.0)
    context.draw(cgImage, in: CGRect(origin: origin, size: image.size))
  }
}

/**
 Creates a new image by flipping given image vertically or horizontally.
 */
internal func manipulate(image: UIImage, flip: FlipType) throws -> UIImage {
  let imageView = UIImageView(image: image)

  return try drawInNewContext(size: imageView.frame.size) { context in
    switch flip {
    case .vertical:
      let transform = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: imageView.frame.size.height)
      context.concatenate(transform)
    case .horizontal:
      let transform = CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: imageView.frame.size.width, ty: 0)
      context.concatenate(transform)
    }
    imageView.layer.render(in: context)
  }
}

/**
 Creates a new image by cropping given image to specified width and height.
 */
internal func manipulate(image: UIImage, crop: CropRect) throws -> UIImage {
  let rect = crop.toRect()
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

/**
 Makes sure the image is oriented up and not mirrored.
 Guarantees that the original pixel data matches the displayed orientation.
 */
internal func fixImageOrientation(_ image: UIImage) throws -> UIImage {
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

  let context = CGContext(
    data: nil,
    width: Int(image.size.width),
    height: Int(image.size.height),
    bitsPerComponent: cgImage.bitsPerComponent,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  )

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

/**
 Helper function for drawing the image in graphics context.
 Throws appropriate exceptions when the context is missing or the image couldn't be rendered.
 */
private func drawInNewContext(size: CGSize, drawing: (CGContext) -> Void) throws -> UIImage {
  UIGraphicsBeginImageContext(size)

  guard let context = UIGraphicsGetCurrentContext() else {
    UIGraphicsEndImageContext()
    throw ImageContextLostException()
  }

  drawing(context)

  guard let newImage = UIGraphicsGetImageFromCurrentImageContext() else {
    UIGraphicsEndImageContext()
    throw NoImageInContextException()
  }

  UIGraphicsEndImageContext()
  return newImage
}
