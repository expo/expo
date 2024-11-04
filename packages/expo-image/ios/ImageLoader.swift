// Copyright 2024-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

internal final class ImageLoader {
  static let shared = ImageLoader()

  lazy var imageManager = SDWebImageManager(
    cache: SDImageCache.shared,
    loader: SDImageLoadersManager.shared
  )

  func load(_ source: ImageSource, maxSize: CGSize? = nil) async throws -> UIImage {
    // This loader uses only the disk cache. We may want to give more control on this, but the memory cache
    // doesn't make much sense for shared refs as they're kept in memory as long as their JS objects.
    var context = createSDWebImageContext(forSource: source, cachePolicy: .disk)

    if let maxSize {
      context[.imageThumbnailPixelSize] = maxSize
    }

    return try await withCheckedThrowingContinuation { continuation in
      imageManager.loadImage(with: source.uri, context: context, progress: nil) { image, _, error, _, _, _ in
        if let image {
          continuation.resume(returning: image)
        } else {
          continuation.resume(throwing: ImageLoadingFailed().causedBy(error))
        }
      }
    }
  }
}

internal final class ImageLoadingFailed: Exception {
  override var reason: String {
    "Failed to load an image"
  }
}
