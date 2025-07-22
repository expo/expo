// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

/**
 An exception to throw when it its not possible to generate a blurhash for a given URL.
 */
public final class BlurhashGenerationException: Exception {
  override public var reason: String {
    "Unable to generate blurhash, make sure the image exists at the given URL"
  }
}

func cacheTypeToString(_ cacheType: SDImageCacheType) -> String {
  switch cacheType {
  case .none:
    return "none"
  case .disk:
    return "disk"
  case .memory, .all:
    // `all` doesn't make much sense, so we treat it as `memory`.
    return "memory"
  @unknown default:
    log.error("Unhandled `SDImageCacheType` value: \(cacheType), returning `none` as fallback. Add the missing case as soon as possible.")
    return "none"
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
 Calculates the ideal size that fills in the container size while maintaining the source aspect ratio.
 */
func idealSize(contentPixelSize: CGSize, containerSize: CGSize, scale: Double = 1.0, contentFit: ContentFit) -> CGSize {
  switch contentFit {
  case .contain:
    let aspectRatio = min(containerSize.width / contentPixelSize.width, containerSize.height / contentPixelSize.height)
    return contentPixelSize * aspectRatio
  case .cover:
    let aspectRatio = max(containerSize.width / contentPixelSize.width, containerSize.height / contentPixelSize.height)
    return contentPixelSize * aspectRatio
  case .fill:
    return containerSize
  case .scaleDown:
    if containerSize.width < contentPixelSize.width / scale || containerSize.height < contentPixelSize.height / scale {
      // The container is smaller than the image — scale it down and behave like `contain`
      let aspectRatio = min(containerSize.width / contentPixelSize.width, containerSize.height / contentPixelSize.height)
      return contentPixelSize * aspectRatio
    } else {
      // The container is bigger than the image — don't scale it and behave like `none`
      return contentPixelSize / scale
    }
  case .none:
    return contentPixelSize / scale
  }
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
  return imageSize.width > (size.width * scale) && imageSize.height > (size.height * scale)
}

/**
 Resizes a static image to fit in the given size and scale.
 */
func resize(image: UIImage, toSize size: CGSize, scale: Double) -> UIImage {
  let format = UIGraphicsImageRendererFormat()
  format.scale = scale

  return UIGraphicsImageRenderer(size: size, format: format).image { _ in
    image.draw(in: CGRect(origin: .zero, size: size))
  }
}

/**
 The image source that fits best into the given size, that is the one with the closest number of pixels.
 May be `nil` if there are no sources available or the size is zero.
 */
func getBestSource(from sources: [ImageSource]?, forSize size: CGSize, scale: Double = 1.0) -> ImageSource? {
  guard let sources = sources, !sources.isEmpty else {
    return nil
  }
  if size.width <= 0 || size.height <= 0 {
    return nil
  }
  if sources.count == 1 {
    return sources.first
  }
  var bestSource: ImageSource?
  var bestFit = Double.infinity
  let targetPixelCount = size.width * size.height * scale * scale

  for source in sources {
    let fit = abs(1 - (source.pixelCount / targetPixelCount))

    if fit < bestFit {
      bestSource = source
      bestFit = fit
    }
  }
  return bestSource
}

/**
 Creates the cache key filter that returns the specific string.
 */
func createCacheKeyFilter(_ cacheKey: String?) -> SDWebImageCacheKeyFilter? {
  guard let cacheKey = cacheKey else {
    return nil
  }
  return SDWebImageCacheKeyFilter { _ in
    return cacheKey
  }
}

/**
 Creates a default image context based on the source and the cache policy.
 */
func createSDWebImageContext(forSource source: ImageSource, cachePolicy: ImageCachePolicy = .disk, useAppleWebpCodec: Bool = true) -> SDWebImageContext {
  var context = SDWebImageContext()

  // Modify URL request to add headers.
  if let headers = source.headers {
    context[.downloadRequestModifier] = SDWebImageDownloaderRequestModifier(headers: headers)
  }

  // Allow for custom cache key. If not specified in the source, its uri is used as the key.
  context[.cacheKeyFilter] = createCacheKeyFilter(source.cacheKey)

  // Tell SDWebImage to use our own class for animated formats,
  // which has better compatibility with the UIImage and fixes issues with the image duration.
  context[.animatedImageClass] = AnimatedImage.self

  // Passing useAppleWebpCodec into WebPCoder
  context[.imageDecodeOptions] = [
    imageCoderOptionUseAppleWebpCodec: useAppleWebpCodec
  ]

  // Assets from the bundler have `scale` prop which needs to be passed to the context,
  // otherwise they would be saved in cache with scale = 1.0 which may result in
  // incorrectly rendered images for resize modes that don't scale (`center` and `repeat`).
  context[.imageScaleFactor] = source.scale

  let sdCacheType = cachePolicy.toSdCacheType().rawValue
  context[.queryCacheType] = sdCacheType
  context[.storeCacheType] = sdCacheType

  if source.cacheOriginalImage {
    context[.originalQueryCacheType] = sdCacheType
    context[.originalStoreCacheType] = sdCacheType
  } else {
    context[.originalQueryCacheType] = SDImageCacheType.none.rawValue
    context[.originalStoreCacheType] = SDImageCacheType.none.rawValue
  }

  // Some loaders (e.g. blurhash) may need access to the source.
  context[ImageView.contextSourceKey] = source

  return context
}

extension CGSize {
  /**
   Multiplies a size with a scalar.
   */
  static func * (size: CGSize, scalar: Double) -> CGSize {
    return CGSize(width: size.width * scalar, height: size.height * scalar)
  }

  /**
   Divides a size with a scalar.
   */
  static func / (size: CGSize, scalar: Double) -> CGSize {
    return CGSize(width: size.width / scalar, height: size.height / scalar)
  }

  /**
   Returns a new CGSize with width and height rounded to an integral value using the specified rounding rule.
   */
  func rounded(_ rule: FloatingPointRoundingRule) -> CGSize {
    return CGSize(width: width.rounded(rule), height: height.rounded(rule))
  }
}

func makeNSError(description: String) -> NSError {
  let userInfo = [NSLocalizedDescriptionKey: description]
  return NSError(domain: "expo.modules.image", code: 0, userInfo: userInfo)
}

// MARK: - Async helpers
// TODO: Add helpers like these to the modules core eventually

/**
 Asynchronously maps the given sequence (sequentially).
 */
func asyncMap<ItemsType: Sequence, ResultType>(
  _ items: ItemsType,
  _ transform: (ItemsType.Element) async throws -> ResultType
) async rethrows -> [ResultType] {
  var values = [ResultType]()

  for item in items {
    try await values.append(transform(item))
  }
  return values
}

/**
 Concurrently maps the given sequence.
 */
func concurrentMap<ItemsType: Sequence, ResultType>(
  _ items: ItemsType,
  _ transform: @escaping (ItemsType.Element) async throws -> ResultType
) async rethrows -> [ResultType] {
  let tasks = items.map { item in
    Task {
      try await transform(item)
    }
  }
  return try await asyncMap(tasks) { task in
    try await task.value
  }
}
