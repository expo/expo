// Copyright 2026-present 650 Industries. All rights reserved.

internal import SDWebImage

/// The pipeline that loads images with SDWebImage. It uses the cache and the loaders of `ImageView` and the module
/// functions, so all of them share one cache. Unchecked `Sendable`: `SDWebImageManager` and `SDImageCache` are
/// thread-safe.
final class SDWebImagePipeline: ImagePipeline, @unchecked Sendable {
  static let shared = SDWebImagePipeline()

  private let imageCache = SDImageCache.shared
  private let imageManager: SDWebImageManager

  private init() {
    imageManager = SDWebImageManager(cache: imageCache, loader: SDImageLoadersManager.shared)
  }

  func cachedImage(for request: ImagePipelineRequest) -> ImagePipelineResult? {
    // Like a load, the `disk` and `none` policies don't read the memory cache.
    guard request.cachePolicy == .memory || request.cachePolicy == .memoryAndDisk else {
      return nil
    }
    let context = createSDWebImageContext(forSource: request.imageSource, cachePolicy: request.cachePolicy)

    guard let key = imageManager.cacheKey(for: request.uri, context: context),
      let image = imageCache.imageFromMemoryCache(forKey: key) else {
      return nil
    }
    return ImagePipelineResult(
      image: image,
      cacheType: .memory,
      url: request.uri,
      mediaType: imageFormatToMediaType(image.sd_imageFormat)
    )
  }

  func image(
    for request: ImagePipelineRequest,
    progress: (@Sendable (ImagePipelineProgress) -> Void)?
  ) async throws -> ImagePipelineResult {
    let source = request.imageSource
    let context = createSDWebImageContext(forSource: source, cachePolicy: request.cachePolicy)
    let isPhotoLibraryAsset = source.isPhotoLibraryAsset
    let load = SDWebImageLoad()

    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        guard load.begin(continuation) else {
          return
        }
        let operation = imageManager.loadImage(
          with: request.uri,
          options: [.retryFailed, .handleCookies, .transformAnimatedImage],
          context: context,
          progress: progress.map { progress in
            return { @Sendable receivedSize, expectedSize, _ in
              // The expected size is unknown (0 or -1) in the first calls.
              guard expectedSize > 0 else {
                return
              }
              progress(ImagePipelineProgress(
                loadedBytes: isPhotoLibraryAsset ? nil : receivedSize,
                totalBytes: isPhotoLibraryAsset ? nil : expectedSize,
                fraction: Double(receivedSize) / Double(expectedSize)
              ))
            }
          },
          completed: { @Sendable image, _, error, cacheType, finished, url in
            if let error {
              let nsError = error as NSError
              let isCancellation =
                nsError.domain == SDWebImageErrorDomain && nsError.code == SDWebImageError.cancelled.rawValue
              load.finish(.failure(isCancellation ? CancellationError() : error))
              return
            }
            // A degraded image from the Photos library comes with `finished` set to `false`, before the full one.
            guard finished else {
              return
            }
            guard let image else {
              load.finish(.failure(ImagePipelineMissingImageError()))
              return
            }
            load.finish(.success(ImagePipelineResult(
              image: image,
              cacheType: ImageCacheType.fromSdCacheType(cacheType),
              url: url,
              mediaType: imageFormatToMediaType(image.sd_imageFormat)
            )))
          }
        )
        load.setOperation(operation)
      }
    } onCancel: {
      load.cancel()
    }
  }
}

private extension ImagePipelineRequest {
  /// The source that the SDWebImage context and the custom loaders read.
  var imageSource: ImageSource {
    let source = ImageSource()
    source.uri = uri
    source.width = width
    source.height = height
    source.scale = scale
    source.headers = headers
    source.cacheKey = cacheKey
    return source
  }
}

/// One SDWebImage load behind an async call. It resumes the continuation once: with the result, or with
/// `CancellationError` as soon as the task is canceled, without waiting for SDWebImage. Unchecked `Sendable`: the lock
/// guards the state.
private final class SDWebImageLoad: @unchecked Sendable {
  private let lock = NSLock()
  private var continuation: CheckedContinuation<ImagePipelineResult, any Error>?
  private var operation: SDWebImageCombinedOperation?
  private var isCanceled = false

  /// Keeps the continuation, or resumes it when the task was canceled first. Returns whether the load should start.
  func begin(_ continuation: CheckedContinuation<ImagePipelineResult, any Error>) -> Bool {
    lock.lock()
    guard !isCanceled else {
      lock.unlock()
      continuation.resume(throwing: CancellationError())
      return false
    }
    self.continuation = continuation
    lock.unlock()
    return true
  }

  /// Keeps the operation, so that a cancel can cancel it. A memory cache hit can finish the load before this call.
  func setOperation(_ operation: SDWebImageCombinedOperation?) {
    lock.lock()
    guard !isCanceled else {
      lock.unlock()
      operation?.cancel()
      return
    }
    // The operation can keep the completion block, which keeps this object, so a finished load doesn't keep it.
    if continuation != nil {
      self.operation = operation
    }
    lock.unlock()
  }

  func finish(_ result: Result<ImagePipelineResult, any Error>) {
    lock.lock()
    let continuation = self.continuation
    self.continuation = nil
    operation = nil
    lock.unlock()
    continuation?.resume(with: result)
  }

  func cancel() {
    lock.lock()
    isCanceled = true
    let continuation = self.continuation
    let operation = self.operation
    self.continuation = nil
    self.operation = nil
    lock.unlock()
    operation?.cancel()
    continuation?.resume(throwing: CancellationError())
  }
}

/// SDWebImage finished a load with neither an image nor an error.
private struct ImagePipelineMissingImageError: LocalizedError {
  var errorDescription: String? {
    return "The image loader finished without an image and without an error. For a Photos library (`ph://`) source, "
      + "the asset is probably not available, for example an iCloud photo that couldn't download. Check the source URL."
  }
}
