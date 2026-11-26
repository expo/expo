// Copyright 2026-present 650 Industries. All rights reserved.

import UIKit

/// What `ImageView2` asks a pipeline to load, as plain values that can cross threads.
struct ImagePipelineRequest: Sendable {
  let uri: URL
  /// The size that the source declares. Hash sources (blurhash) decode at this size.
  let width: Double
  let height: Double
  let scale: Double
  let headers: [String: String]?
  let cacheKey: String?
  let cachePolicy: ImageCachePolicy
}

extension ImagePipelineRequest {
  init(source: ImageSource, uri: URL, cachePolicy: ImageCachePolicy) {
    self.init(
      uri: uri,
      width: source.width,
      height: source.height,
      scale: source.scale,
      headers: source.headers,
      cacheKey: source.cacheKey,
      cachePolicy: cachePolicy
    )
  }
}

/// The progress of a load. The Photos library reports only the fraction, without sizes in bytes.
struct ImagePipelineProgress: Sendable {
  let loadedBytes: Int?
  let totalBytes: Int?
  let fraction: Double
}

/// A loaded image and where it came from.
struct ImagePipelineResult: Sendable {
  let image: UIImage
  let cacheType: ImageCacheType
  let url: URL?
  let mediaType: String?
}

/// Loads the images of `ImageView2`, so that the view doesn't depend on the engine that loads them.
protocol ImagePipeline: Sendable {
  /// The image of the request from the memory cache, without I/O, or `nil`. It's synchronous, so that the view can
  /// display a memory cache hit in the current frame: a task resumes on a later turn of the main queue.
  func cachedImage(for request: ImagePipelineRequest) -> ImagePipelineResult?

  /// Loads the image of the request. Canceling the task cancels the load, which then throws `CancellationError`.
  /// `progress` can run on any thread.
  func image(
    for request: ImagePipelineRequest,
    progress: (@Sendable (ImagePipelineProgress) -> Void)?
  ) async throws -> ImagePipelineResult
}
