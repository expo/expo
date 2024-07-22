// Copyright 2024-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

internal final class ImageLoader {
  static let shared = ImageLoader()

  lazy var imageManager = SDWebImageManager(
    cache: SDImageCache.shared,
    loader: SDImageLoadersManager.shared
  )

  func load(_ source: ImageSource) async throws -> UIImage {
    return try await withCheckedThrowingContinuation { continuation in
      imageManager.loadImage(with: source.uri, progress: nil) { image, _, error, _, _, _ in
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
