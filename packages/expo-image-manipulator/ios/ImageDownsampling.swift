// Copyright 2026-present 650 Industries. All rights reserved.

import CoreGraphics
import ImageIO
import UIKit

/**
 Computes the value for `kCGImageSourceThumbnailMaxPixelSize` that bounds an image
 of the given size to `maxWidth`/`maxHeight`, preserving the aspect ratio.
 Returns `nil` when the image already fits within the bounds (or no bounds are given),
 in which case no downscaling is needed.
 */
internal func downsampledMaxPixelSize(width: Double, height: Double, maxWidth: Double?, maxHeight: Double?) -> Double? {
  guard width > 0, height > 0 else {
    return nil
  }
  var scale = 1.0
  if let maxWidth, maxWidth > 0 {
    scale = min(scale, maxWidth / width)
  }
  if let maxHeight, maxHeight > 0 {
    scale = min(scale, maxHeight / height)
  }
  if scale >= 1.0 {
    return nil
  }
  return (max(width, height) * scale).rounded()
}

/**
 Decodes the image at the given file URL, downsampled to fit within `maxWidth`/`maxHeight`.
 Returns `nil` when no downscaling is needed — the caller should fall back to its regular loading path.
 */
internal func decodeDownsampledImage(at url: URL, maxWidth: Double?, maxHeight: Double?) -> UIImage? {
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else {
    return nil
  }
  return decodeDownsampledImage(source: source, maxWidth: maxWidth, maxHeight: maxHeight)
}

/**
 Decodes the image from the given data, downsampled to fit within `maxWidth`/`maxHeight`.
 Returns `nil` when no downscaling is needed — the caller should fall back to its regular loading path.
 */
internal func decodeDownsampledImage(data: Data, maxWidth: Double?, maxHeight: Double?) -> UIImage? {
  guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
    return nil
  }
  return decodeDownsampledImage(source: source, maxWidth: maxWidth, maxHeight: maxHeight)
}

/**
 Decodes the image from the given source, downsampled to fit within `maxWidth`/`maxHeight`.
 Unlike decoding the full-sized image and then resizing it, `CGImageSourceCreateThumbnailAtIndex`
 never materializes the full-sized bitmap in memory, which keeps the peak memory usage
 proportional to the bounds instead of the image resolution (see https://github.com/expo/expo/issues/40158).
 */
private func decodeDownsampledImage(source: CGImageSource, maxWidth: Double?, maxHeight: Double?) -> UIImage? {
  guard let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
    let pixelWidth = properties[kCGImagePropertyPixelWidth] as? Double,
    let pixelHeight = properties[kCGImagePropertyPixelHeight] as? Double else {
    return nil
  }
  // EXIF orientations 5-8 rotate the image by 90°, swapping the displayed dimensions.
  let orientation = properties[kCGImagePropertyOrientation] as? UInt32 ?? 1
  let orientedWidth = orientation >= 5 ? pixelHeight : pixelWidth
  let orientedHeight = orientation >= 5 ? pixelWidth : pixelHeight

  guard let maxPixelSize = downsampledMaxPixelSize(width: orientedWidth, height: orientedHeight, maxWidth: maxWidth, maxHeight: maxHeight) else {
    return nil
  }
  let options: [CFString: Any] = [
    kCGImageSourceCreateThumbnailFromImageAlways: true,
    // Bake the EXIF orientation into the pixels so the bounds apply to the displayed dimensions.
    kCGImageSourceCreateThumbnailWithTransform: true,
    kCGImageSourceShouldAllowFloat: true,
    kCGImageSourceThumbnailMaxPixelSize: maxPixelSize
  ]
  guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
    return nil
  }
  return UIImage(cgImage: cgImage)
}

/**
 Downscales an already decoded image to fit within `maxWidth`/`maxHeight`.
 Returns the image untouched when it already fits within the bounds.
 */
internal func downscaledIfExceedsBounds(_ image: UIImage, maxWidth: Double?, maxHeight: Double?) -> UIImage {
  let width = image.size.width * image.scale
  let height = image.size.height * image.scale
  guard let maxPixelSize = downsampledMaxPixelSize(width: width, height: height, maxWidth: maxWidth, maxHeight: maxHeight) else {
    return image
  }
  let scale = maxPixelSize / max(width, height)
  let targetSize = CGSize(width: (width * scale).rounded(), height: (height * scale).rounded())

  return drawInNewContext(size: targetSize) { _ in
    image.draw(in: CGRect(origin: .zero, size: targetSize))
  }
}
