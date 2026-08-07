// Copyright 2026-present 650 Industries. All rights reserved.

internal import SDWebImage
internal import SDWebImageSVGCoder

/**
 A cancellation token for an in-flight variable-substituted SVG load.
 */
internal final class SVGVariablesLoadTask: @unchecked Sendable {
  private let lock = NSLock()
  private var cancelled = false
  private var downloadToken: SDWebImageDownloadToken?

  var isCancelled: Bool {
    lock.lock()
    defer { lock.unlock() }
    return cancelled
  }

  fileprivate func attach(_ token: SDWebImageDownloadToken?) {
    lock.lock()
    defer { lock.unlock() }
    if cancelled {
      token?.cancel()
    } else {
      downloadToken = token
    }
  }

  func cancel() {
    lock.lock()
    defer { lock.unlock() }
    cancelled = true
    downloadToken?.cancel()
    downloadToken = nil
  }
}

/**
 Loads SVG sources that have `svgVariables` set.

 This deliberately sidesteps `SDWebImageManager`. The manager caches the image it decodes, and with
 substitution happening at decode time that would put a variable-substituted document into the
 shared cache — including under the un-substituted cache key, via the disk-hit write-back in
 `SDWebImageManager`. A source rendered with one set of variables could then be served for another.

 Instead only the original document is cached, on disk under the same key a normal load would use,
 so variants share one cached download. Substitution and parsing happen per view. Nothing derived is
 cached anywhere, which is also why changing `svgVariables` cannot serve a stale variant.
 */
internal final class SVGVariablesImageLoader: Sendable {
  static let shared = SVGVariablesImageLoader()

  private let queue = DispatchQueue(
    label: "dev.expo.modules.image.svgVariables",
    qos: .userInitiated,
    attributes: .concurrent
  )

  typealias Completion = @Sendable (UIImage?, Data?, Error?, SDImageCacheType) -> Void

  /**
   Everything one load needs, boxed so it can be handed between SDWebImage's callback queues and
   ours as a single value.

   The conformance is unchecked because `context` holds `Any` values and `progress` is a plain
   closure, neither of which Swift can prove safe to transfer. It holds in practice: the box is
   created on the main queue, only ever read afterwards, and both callbacks that receive it —
   SDWebImage's disk query and its downloader — deliver on the main queue.
   */
  private struct Request: @unchecked Sendable {
    let url: URL
    let cacheKey: String
    let variables: [String: String]
    let scale: Double
    let context: SDWebImageContext
    let task: SVGVariablesLoadTask
    let progress: SDImageLoaderProgressBlock?
    let completion: Completion
  }

  /**
   Resolves the original SVG for a source, substitutes the variables into it and decodes the result
   as a vector image. The completion is always called on the main queue, and is skipped entirely when
   the task has been cancelled.
   */
  // swiftlint:disable:next function_parameter_count
  func load(
    url: URL,
    cacheKey: String,
    variables: [String: String],
    scale: Double,
    context: SDWebImageContext,
    task: SVGVariablesLoadTask,
    progress: SDImageLoaderProgressBlock?,
    completion: @escaping Completion
  ) {
    let request = Request(
      url: url,
      cacheKey: cacheKey,
      variables: variables,
      scale: scale,
      context: context,
      task: task,
      progress: progress,
      completion: completion
    )

    // Local files are already on disk — there is nothing to cache and nothing to download.
    if url.isFileURL {
      queue.async {
        guard !request.task.isCancelled else {
          return
        }
        do {
          self.finish(data: try Data(contentsOf: request.url), cacheType: .none, request: request)
        } catch {
          self.fail(with: error, request: request)
        }
      }
      return
    }

    // Always called on the main queue, so the work below is hopped onto our own.
    SDImageCache.shared.diskImageDataQuery(forKey: cacheKey) { data in
      guard !request.task.isCancelled else {
        return
      }
      guard let data else {
        self.download(request: request)
        return
      }
      self.queue.async {
        self.finish(data: data, cacheType: .disk, request: request)
      }
    }
  }

  // MARK: - Private

  private func download(request: Request) {
    // The downloader gives us the untouched bytes along with headers, cookies and progress handling.
    // It also decodes the data, which we ignore — the document we want is the substituted one.
    let token = SDWebImageDownloader.shared.downloadImage(
      with: request.url,
      options: [],
      context: request.context,
      progress: request.progress
    ) { _, data, error, finished in
      guard finished, !request.task.isCancelled else {
        return
      }
      guard let data else {
        self.fail(with: error ?? SVGVariablesLoadingFailed(), request: request)
        return
      }
      // Cache the original document, never the substituted one.
      SDImageCache.shared.storeImageData(toDisk: data, forKey: request.cacheKey)

      self.queue.async {
        self.finish(data: data, cacheType: .none, request: request)
      }
    }
    request.task.attach(token)
  }

  /// Substitutes and decodes. Must be called off the main queue.
  private func finish(data: Data, cacheType: SDImageCacheType, request: Request) {
    let substituted = SVGVariables.substitute(in: data, variables: request.variables)

    // No thumbnail size is passed on purpose. That is what makes the SVG coder take its vector
    // branch instead of rasterizing the document at the view's current size.
    let image = SDImageSVGCoder.shared.decodedImage(with: substituted, options: [
      .decodeScaleFactor: request.scale
    ])

    DispatchQueue.main.async {
      guard !request.task.isCancelled else {
        return
      }
      if let image {
        // The original data is reported, not the substituted document — it is what the cache holds.
        request.completion(image, data, nil, cacheType)
      } else {
        request.completion(nil, data, SVGVariablesDecodingFailed(), cacheType)
      }
    }
  }

  private func fail(with error: Error, request: Request) {
    DispatchQueue.main.async {
      guard !request.task.isCancelled else {
        return
      }
      request.completion(nil, nil, error, .none)
    }
  }
}

internal struct SVGVariablesLoadingFailed: LocalizedError {
  var errorDescription: String? {
    "Failed to download the SVG document"
  }
}

internal struct SVGVariablesDecodingFailed: LocalizedError {
  var errorDescription: String? {
    "Failed to decode the SVG document after substituting its variables. The substituted document may not be valid SVG — check the values passed to `svgVariables`."
  }
}
