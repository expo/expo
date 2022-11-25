// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

// MARK: - Constants

/**
 When downscaling, the ideal size will be (up)scaled by this value so we can throttle re-scaling when the view is resized.
 */
let downscalingThreshold = 1.2

// MARK: - Functions

func cacheTypeToString(_ cacheType: SDImageCacheType) -> String {
  switch cacheType {
  case .none:
    return "none"
  case .disk:
    return "disk"
  case .memory, .all:
    // `all` doesn't make much sense, so we treat it as `memory`.
    return "memory"
  }
}

func imageFormatToMediaType(_ format: SDImageFormat) -> String? {
  switch format {
  case .undefined:
    return nil
  case .JPEG:
    return "image/jpeg"
  case .PNG:
    return "image/png"
  case .GIF:
    return "image/gif"
  case .TIFF:
    return "image/tiff"
  case .webP:
    return "image/webp"
  case .HEIC:
    return "image/heic"
  case .HEIF:
    return "image/heif"
  case .PDF:
    return "application/pdf"
  case .SVG:
    return "image/svg+xml"
  default:
    // On one hand we could remove this clause and always ensure that we have handled
    // all supported formats (by erroring compilation otherwise).
    // On the other hand, we do support overriding SDWebImage version,
    // so we shouldn't fail to compile on SDWebImage versions with.
    return nil
  }
}

/**
 Calculates the ideal size that fills in the target size while maintaining the source aspect ratio.
 */
func idealSize(sourceSize: CGSize, targetSize: CGSize) -> CGSize {
  let aspectRatio = max(targetSize.width / sourceSize.width, targetSize.height / sourceSize.height)
  return sourceSize * aspectRatio
}

/**
 Returns a bool whether the image should be downscaled to the given size.
 */
func shouldDownscale(image: UIImage, toSize size: CGSize, scale: Double) -> Bool {
  if size.width <= 0 || size.height <= 0 {
    // View is invisible, so no reason to keep the image in memory.
    // This already ensures that we won't be diving by zero in ratio calculations.
    return true
  }
  if size.width.isInfinite || size.height.isInfinite {
    // Keep the image unscaled for infinite sizes.
    return false
  }
  let imageSize = image.size * image.scale
  let idealSize = size * scale

  return imageSize.width > idealSize.width * downscalingThreshold && imageSize.height > idealSize.height * downscalingThreshold
}

/**
 Downscales the given image only if necessary (image is much bigger than the view frame).
 */
func maybeDownscale(image: UIImage, frameSize size: CGSize, scale: Double) -> UIImage {
  // Calculate the ideal size. Source and target sizes are first normalized from points to pixels.
  let idealSize = (
    idealSize(sourceSize: image.size * image.scale, targetSize: size * scale) * (downscalingThreshold / scale)
  ).rounded(.up)

  if shouldDownscale(image: image, toSize: idealSize, scale: scale) {
    return resize(animatedImage: image, toSize: idealSize, scale: scale)
  }
  return image
}

/**
 Resizes the animated image to fit in the given size and scale.
 */
func resize(animatedImage image: UIImage, toSize size: CGSize, scale: Double) -> UIImage {
  // For animated images, the `images` member is non-nil and represents an array of animation frames.
  if let images = image.images {
    // Resize each animation frame separately.
    let resizedImages = images.map { image in
      return resize(image: image, toSize: size, scale: scale)
    }

    // `animatedImage(with:duration:)` can return `nil`, probably when scales are not the same
    // so it should never happen in our case, but let's handle it gracefully.
    if let animatedImage = UIImage.animatedImage(with: resizedImages, duration: image.duration) {
      return animatedImage
    }
  }
  return resize(image: image, toSize: size, scale: scale)
}

/**
 Resizes a still image to fit in the given size and scale.
 */
func resize(image: UIImage, toSize size: CGSize, scale: Double) -> UIImage {
  let format = UIGraphicsImageRendererFormat()
  format.scale = scale

  return UIGraphicsImageRenderer(size: size, format: format).image { _ in
    image.draw(in: CGRect(origin: .zero, size: size))
  }
}

extension CGSize {
  /**
   Multiplies a size with a scalar.
   */
  static func * (size: CGSize, scalar: Double) -> CGSize {
    return CGSize(width: size.width * scalar, height: size.height * scalar)
  }

  /**
   Returns a new CGSize with width and height rounded to an integral value using the specified rounding rule.
   */
  func rounded(_ rule: FloatingPointRoundingRule) -> CGSize {
    return CGSize(width: width.rounded(rule), height: height.rounded(rule))
  }
}
