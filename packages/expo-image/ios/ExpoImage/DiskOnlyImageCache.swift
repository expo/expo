// Copyright 2026-present 650 Industries. All rights reserved.

internal import SDWebImage

/**
 The image cache for the `disk` cache policy. It forwards to the shared `SDImageCache`, but never stores images in the memory cache.
 `SDWebImageManager` writes every disk cache hit to the memory cache and ignores the store cache type of the context.
 A view with the `disk` policy doesn't read the memory cache, so these decoded images only take memory until a memory warning.
 */
final class DiskOnlyImageCache: NSObject, SDImageCacheProtocol, Sendable {
  static let shared = DiskOnlyImageCache()

  func queryImage(
    forKey key: String?,
    options: SDWebImageOptions = [],
    context: [SDWebImageContextOption: Any]?,
    completion: SDImageCacheQueryCompletionBlock? = nil
  ) -> SDWebImageOperation? {
    return queryImage(forKey: key, options: options, context: context, cacheType: .disk, completion: completion)
  }

  func queryImage(
    forKey key: String?,
    options: SDWebImageOptions = [],
    context: [SDWebImageContextOption: Any]?,
    cacheType: SDImageCacheType,
    completion: SDImageCacheQueryCompletionBlock? = nil
  ) -> SDWebImageOperation? {
    return SDImageCache.shared.queryImage(forKey: key, options: options, context: context, cacheType: cacheType, completion: completion)
  }

  func store(
    _ image: UIImage?,
    imageData: Data?,
    forKey key: String?,
    cacheType: SDImageCacheType,
    completion: SDWebImageNoParamsBlock? = nil
  ) {
    store(image, imageData: imageData, forKey: key, options: [], context: nil, cacheType: cacheType, completion: completion)
  }

  func store(
    _ image: UIImage?,
    imageData: Data?,
    forKey key: String?,
    options: SDWebImageOptions = [],
    context: [SDWebImageContextOption: Any]?,
    cacheType: SDImageCacheType,
    completion: SDWebImageNoParamsBlock? = nil
  ) {
    guard cacheType == .disk || cacheType == .all else {
      completion?()
      return
    }
    SDImageCache.shared.store(image, imageData: imageData, forKey: key, options: options, context: context, cacheType: .disk, completion: completion)
  }
}
