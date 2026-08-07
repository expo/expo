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
internal final class SVGVariablesImageLoader {
  nonisolated(unsafe) static let shared = SVGVariablesImageLoader()

  private let queue = DispatchQueue(
    label: "dev.expo.modules.image.svgVariables",
    qos: .userInitiated,
    attributes: .concurrent
  )

  typealias Completion = (UIImage?, Data?, Error?, SDImageCacheType) -> Void

  /**
   Resolves the original SVG for a source, substitutes the variables into it and decodes the result
   as a vector image. The completion is always called on the main queue, and is skipped entirely when
   the task has been cancelled.
   */
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
    // Local files are already on disk — there is nothing to cache and nothing to download.
    if url.isFileURL {
      queue.async { [weak self] in
        guard let self, !task.isCancelled else {
          return
        }
        do {
          let data = try Data(contentsOf: url)
          self.finish(data: data, cacheType: .none, variables: variables, scale: scale, task: task, completion: completion)
        } catch {
          self.fail(with: error, task: task, completion: completion)
        }
      }
      return
    }

    // Always called on the main queue, so the work below is hopped onto our own.
    SDImageCache.shared.diskImageDataQuery(forKey: cacheKey) { [weak self] data in
      guard let self, !task.isCancelled else {
        return
      }
      if let data {
        self.queue.async {
          self.finish(data: data, cacheType: .disk, variables: variables, scale: scale, task: task, completion: completion)
        }
        return
      }
      self.download(
        url: url,
        cacheKey: cacheKey,
        variables: variables,
        scale: scale,
        context: context,
        task: task,
        progress: progress,
        completion: completion
      )
    }
  }

  // MARK: - Private

  private func download(
    url: URL,
    cacheKey: String,
    variables: [String: String],
    scale: Double,
    context: SDWebImageContext,
    task: SVGVariablesLoadTask,
    progress: SDImageLoaderProgressBlock?,
    completion: @escaping Completion
  ) {
    // The downloader gives us the untouched bytes along with headers, cookies and progress handling.
    // It also decodes the data, which we ignore — the document we want is the substituted one.
    let token = SDWebImageDownloader.shared.downloadImage(
      with: url,
      options: [],
      context: context,
      progress: progress
    ) { [weak self] _, data, error, finished in
      guard let self, finished, !task.isCancelled else {
        return
      }
      guard let data else {
        self.fail(with: error ?? SVGVariablesLoadingFailed(), task: task, completion: completion)
        return
      }
      // Cache the original document, never the substituted one.
      SDImageCache.shared.storeImageData(toDisk: data, forKey: cacheKey)

      self.queue.async {
        self.finish(data: data, cacheType: .none, variables: variables, scale: scale, task: task, completion: completion)
      }
    }
    task.attach(token)
  }

  /// Substitutes and decodes. Must be called off the main queue.
  private func finish(
    data: Data,
    cacheType: SDImageCacheType,
    variables: [String: String],
    scale: Double,
    task: SVGVariablesLoadTask,
    completion: @escaping Completion
  ) {
    let substituted = SVGVariables.substitute(in: data, variables: variables)

    // No thumbnail size is passed on purpose. That is what makes the SVG coder take its vector
    // branch instead of rasterizing the document at the view's current size.
    let image = SDImageSVGCoder.shared.decodedImage(with: substituted, options: [
      .decodeScaleFactor: scale
    ])

    DispatchQueue.main.async {
      guard !task.isCancelled else {
        return
      }
      if let image {
        // The original data is reported, not the substituted document — it is what the cache holds.
        completion(image, data, nil, cacheType)
      } else {
        completion(nil, data, SVGVariablesDecodingFailed(), cacheType)
      }
    }
  }

  private func fail(with error: Error, task: SVGVariablesLoadTask, completion: @escaping Completion) {
    DispatchQueue.main.async {
      guard !task.isCancelled else {
        return
      }
      completion(nil, nil, error, .none)
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
