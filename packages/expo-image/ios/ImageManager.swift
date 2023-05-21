import ExpoModulesCore
import SDWebImage

struct ImageLoadResult {
  let image: UIImage?
  let cacheType: ImageCacheType
}

struct ImageLoadOptions {
  let cachePolicy: ImageCachePolicy
  let screenScale: Double
}

private let diskCache = DiskCache()
private let memoryCache = SDMemoryCache<NSString, UIImage>()

internal final class ImageManager {
  private let sdImageManager = SDWebImageManager(
    cache: SDImageCache.shared,
    loader: SDImageLoadersManager.shared
  )

  private var pendingOperation: SDWebImageCombinedOperation?

  internal func queryCache(request: ImageLoadRequest) async {
    let source = request.source
    let options = request.options
    let cacheKey = source.getCacheKey()

    // Try to load the source from caches.
    if source.isCachingAllowed, let cacheKey, !cacheKey.isEmpty {
      if options.cachePolicy.canUseMemoryCache {
        if let image = memoryCache.object(forKey: cacheKey as NSString) as? UIImage {
          // Found the image in the memory.
          request.complete(image: image, cacheType: .memory)
          return
        }
      }
      if options.cachePolicy.canUseDiskCache {
        if let imageData = await diskCache.query(key: cacheKey),
           let image = decodeImageData(imageData, cacheKey: cacheKey) {
          // Found the image in the disk cache.
          request.complete(image: image, cacheType: .disk)
          return
        }
      }
    }
  }

  internal func cacheRequestResult(request: ImageLoadRequest) async {
    let source = request.source
    let options = request.options
    let cacheKey = source.getCacheKey()

    // Save the image to caches if the load succeeded.
    if let image = request.result, source.isCachingAllowed, let cacheKey {
      if options.cachePolicy.canUseMemoryCache {
        memoryCache.setObject(image, forKey: cacheKey as NSString)
      }
      if options.cachePolicy.canUseDiskCache {
        // Defer storing the image on the disk cache, so that the image can be processed and rendered earlier.
        Task {
          if let data = encodeImage(image) {
            await diskCache.store(key: cacheKey, data: data)
          }
        }
      }
    }
  }

  internal func loadImage(request: ImageLoadRequest) -> Task<Void, Error> {
    let source = request.source
    let options = request.options
    let cacheKey = source.getCacheKey()

    return Task {
      await queryCache(request: request)

      if request.state != .loading {
        return
      }

      // Image not found in caches. Here we initiate an actual loading
      // from network, file system or generating the hashed placeholder.
      let image = await sd_loadImage(request: request, source: source, options: options)

      // Stop if the request was aborted or not completed yet.
      guard request.state == .completed else {
        return
      }

      await cacheRequestResult(request: request)
    }

//    return result
  }

  internal func sd_loadImage(request: ImageLoadRequest, source: ImageSource, options: ImageLoadOptions) async -> UIImage? {
    var context = SDWebImageContext()

    // Cancel currently running load requests.
//    cancelPendingOperation()

    // Modify URL request to add headers.
    if let headers = source.headers {
      context[SDWebImageContextOption.downloadRequestModifier] = SDWebImageDownloaderRequestModifier(headers: headers)
    }

    context[.cacheKeyFilter] = createCacheKeyFilter(source.cacheKey)
//    context[.imageTransformer] = createTransformPipeline()

    // Assets from the bundler have `scale` prop which needs to be passed to the context,
    // otherwise they would be saved in cache with scale = 1.0 which may result in
    // incorrectly rendered images for resize modes that don't scale (`center` and `repeat`).
    context[.imageScaleFactor] = source.scale

    context[.originalQueryCacheType] = SDImageCacheType.none.rawValue
    context[.originalStoreCacheType] = SDImageCacheType.none.rawValue
    context[.queryCacheType] = SDImageCacheType.none.rawValue
    context[.storeCacheType] = SDImageCacheType.none.rawValue

    // Some loaders (e.g. blurhash) need access to the source and the screen scale.
    context[ImageView.contextSourceKey] = source
    context[ImageView.screenScaleKey] = options.screenScale

//    onLoadStart([:])

    return await withCheckedContinuation { (continuation: CheckedContinuation<UIImage?, Never>) in
      var pendingOperation: SDWebImageCombinedOperation?

      let completion: SDInternalCompletionBlock = { [pendingOperation] image, data, error, cacheType, finished, imageUrl in
        if request.state != .loading {
          log.debug("Loading canceled")
          pendingOperation?.cancel()
          continuation.resume(returning: nil)
          return
        }

        if let image {
          if finished {
            request.complete(image: image, cacheType: ImageCacheType.fromSdCacheType(cacheType))
            continuation.resume(returning: image)
            pendingOperation?.cancel()
          } else {
            request.partial(image: image)
          }
        } else {
          continuation.resume(returning: nil)
          pendingOperation?.cancel()
        }
      }
      pendingOperation = sdImageManager.loadImage(
        with: source.uri,
        options: [
          .retryFailed,
          .handleCookies
        ],
        context: context,
        progress: nil,
        completed: completion
      )
    }
  }

  // MARK: - helpers

  private func cancelPendingOperation() {
    pendingOperation?.cancel()
    pendingOperation = nil
  }
}

private func getImageFormat(_ image: UIImage) -> SDImageFormat {
  let format = image.sd_imageFormat

  if format == .undefined {
    // Try to guess the format based on whether the image is animated or contains alpha channel.
    if image.sd_isAnimated {
      return .GIF
    } else if let cgImage = image.cgImage {
      return SDImageCoderHelper.cgImageContainsAlpha(cgImage) ? .PNG : .JPEG
    }
  }
  return format
}

private func encodeImage(_ image: UIImage) -> Data? {
  let format = getImageFormat(image)
  return SDImageCodersManager.shared.encodedData(with: image, format: format)
}

private func decodeImageData(_ data: Data, cacheKey: String) -> UIImage? {
  return SDImageCacheDecodeImageData(data, cacheKey, [], nil)
}
