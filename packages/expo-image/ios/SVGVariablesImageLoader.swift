// Copyright 2026-present 650 Industries. All rights reserved.

internal import SDWebImage
internal import SDWebImageSVGCoder

/// Loads SVG sources that have `svgVariables` set.
///
/// This deliberately sidesteps `SDWebImageManager`. The manager caches the image it decodes, and with
/// substitution happening at decode time that would put a variable-substituted document into the
/// shared cache — including under the un-substituted cache key, via the disk-hit write-back in
/// `SDWebImageManager`. A source rendered with one set of variables could then be served for another.
///
/// Instead only the original document is cached, on disk under the same key a normal load would use,
/// so variants share one cached download. Substitution and parsing happen per view. Nothing derived is
/// cached anywhere, which is also why changing `svgVariables` cannot serve a stale variant.
///
/// This is a `Sendable` class rather than an `actor` on purpose. It holds no mutable state, and an
/// actor would serialize loads that have no reason to wait for each other.
internal final class SVGVariablesImageLoader: Sendable {
  static let shared = SVGVariablesImageLoader()

  /// The non-`Sendable` SDWebImage values a load needs, boxed so they can be handed to a `nonisolated`
  /// async function in one piece.
  ///
  /// Unchecked because the context dictionary holds `Any` values and the progress block is a plain
  /// closure — neither is something Swift can prove safe to transfer. It holds here: the box is built
  /// on the main actor, never mutated afterwards, and only read from SDWebImage's own callbacks.
  struct Options: @unchecked Sendable {
    let context: SDWebImageContext
    let progress: SDImageLoaderProgressBlock?
  }

  /// The outcome of one load. The data is the *original* document, which is what the cache holds.
  ///
  /// Unchecked for `UIImage`, which isn't `Sendable`. The image is freshly parsed here, handed
  /// straight to the main actor and never touched again from this side.
  struct Result: @unchecked Sendable {
    let image: UIImage
    let data: Data
    let cacheType: SDImageCacheType
  }

  /// Resolves the original SVG for a source, substitutes the variables into it and parses the result
  /// as a vector image.
  ///
  /// Both the parsing and any download happen off the main actor. Cancelling the surrounding task
  /// cancels an in-flight download. Throws `SVGVariablesNotAnSVG` when the bytes turn out not to be
  /// an SVG at all, which lets the caller fall back to the normal load path.
  func image(
    for url: URL,
    cacheKey: String,
    variables: [String: String],
    scale: Double,
    options: Options
  ) async throws -> Result {
    let (data, cacheType) = try await originalDocument(for: url, cacheKey: cacheKey, options: options)
    try Task.checkCancellation()

    // `svgVariables` is meaningless for other formats, and this loader only knows how to parse SVG.
    // Reporting it lets the view retry through `SDWebImageManager` instead of failing the load.
    guard SDImageSVGCoder.shared.canDecode(from: data) else {
      throw SVGVariablesNotAnSVG()
    }
    return Result(image: try parse(data, variables: variables, scale: scale), data: data, cacheType: cacheType)
  }

  // MARK: - Fetching the original document

  private func originalDocument(
    for url: URL,
    cacheKey: String,
    options: Options
  ) async throws -> (Data, SDImageCacheType) {
    // Local files are already on disk — there is nothing to cache and nothing to download.
    if url.isFileURL {
      return (try Data(contentsOf: url), .none)
    }

    let disk = diskPermissions(from: options.context)
    if disk.query, let cached = await diskDocument(forKey: cacheKey) {
      return (cached, .disk)
    }
    let downloaded = try await download(url, options: options)
    if disk.store {
      // Cache the original document, never the substituted one.
      SDImageCache.shared.storeImageData(toDisk: downloaded, forKey: cacheKey)
    }
    return (downloaded, .none)
  }

  /// Whether the `cachePolicy` prop, which reaches us as cache types on the context, allows the disk
  /// cache to be read and written. Without this the loader would persist documents an app asked not
  /// to cache.
  private func diskPermissions(from context: SDWebImageContext) -> (query: Bool, store: Bool) {
    func allowsDisk(_ option: SDWebImageContextOption) -> Bool {
      guard let raw = context[option] as? NSNumber,
            let cacheType = SDImageCacheType(rawValue: raw.intValue) else {
        // SDWebImage's own default is `.all`.
        return true
      }
      return cacheType == .disk || cacheType == .all
    }
    return (allowsDisk(.queryCacheType), allowsDisk(.storeCacheType))
  }

  private func diskDocument(forKey key: String) async -> Data? {
    await withCheckedContinuation { continuation in
      SDImageCache.shared.diskImageDataQuery(forKey: key) { data in
        continuation.resume(returning: data)
      }
    }
  }

  private func download(_ url: URL, options: Options) async throws -> Data {
    let token = DownloadToken()

    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        // The downloader gives us the untouched bytes along with headers, cookies and progress
        // handling. It also decodes the data, which we ignore — the document we want is the
        // substituted one.
        token.attach(
          SDWebImageDownloader.shared.downloadImage(
            with: url,
            options: [],
            context: options.context,
            progress: options.progress
          ) { _, data, error, finished in
            guard finished else {
              return
            }
            if let data {
              continuation.resume(returning: data)
            } else {
              continuation.resume(throwing: error ?? SVGVariablesLoadingFailed())
            }
          }
        )
      }
    } onCancel: {
      token.cancel()
    }
  }

  // MARK: - Parsing

  /// Substitutes the variables and parses the document. Synchronous, so it runs on the cooperative
  /// thread the caller is already on rather than hopping back to the main actor.
  private func parse(_ data: Data, variables: [String: String], scale: Double) throws -> UIImage {
    let substituted = SVGVariables.substitute(in: data, variables: variables)

    // No thumbnail size is passed on purpose. That is what makes the SVG coder take its vector
    // branch instead of rasterizing the document at the view's current size.
    guard let image = SDImageSVGCoder.shared.decodedImage(with: substituted, options: [
      .decodeScaleFactor: scale
    ]) else {
      throw SVGVariablesDecodingFailed()
    }
    return image
  }
}

/// Bridges `SDWebImageDownloadToken` to task cancellation. The token only exists once the download
/// has started, but `withTaskCancellationHandler` needs something to cancel before that, so this
/// holds the gap and cancels immediately if the task was already cancelled.
private final class DownloadToken: @unchecked Sendable {
  private let lock = NSLock()
  private var token: SDWebImageDownloadToken?
  private var isCancelled = false

  func attach(_ newToken: SDWebImageDownloadToken?) {
    lock.lock()
    defer { lock.unlock() }
    if isCancelled {
      newToken?.cancel()
    } else {
      token = newToken
    }
  }

  func cancel() {
    lock.lock()
    defer { lock.unlock() }
    isCancelled = true
    token?.cancel()
    token = nil
  }
}

/// Thrown when a source with `svgVariables` set turns out not to be an SVG. Not surfaced to JS — the
/// view uses it to retry through the normal load path.
internal struct SVGVariablesNotAnSVG: Error {}

internal struct SVGVariablesLoadingFailed: LocalizedError {
  var errorDescription: String? {
    "Failed to download the SVG document"
  }
}

internal struct SVGVariablesDecodingFailed: LocalizedError {
  var errorDescription: String? {
    "Failed to parse the SVG document after substituting its variables. The substituted document may not be valid SVG — check the values passed to `svgVariables`."
  }
}
