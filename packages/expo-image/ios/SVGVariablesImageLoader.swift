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

  /// The outcome of one load. The data is the *original* document, which is what the cache holds.
  struct Result {
    let image: UIImage
    let data: Data
    let cacheType: SDImageCacheType
  }

  /// Resolves the original SVG for a source, substitutes the variables into it and parses the result
  /// as a vector image.
  ///
  /// Both the parsing and any download happen off the main actor. Cancelling the surrounding task
  /// cancels an in-flight download.
  func image(
    for url: URL,
    cacheKey: String,
    variables: [String: String],
    scale: Double,
    context: SDWebImageContext,
    progress: SDImageLoaderProgressBlock?
  ) async throws -> Result {
    let (data, cacheType) = try await originalDocument(
      for: url,
      cacheKey: cacheKey,
      context: context,
      progress: progress
    )
    try Task.checkCancellation()
    return Result(image: try parse(data, variables: variables, scale: scale), data: data, cacheType: cacheType)
  }

  // MARK: - Fetching the original document

  private func originalDocument(
    for url: URL,
    cacheKey: String,
    context: SDWebImageContext,
    progress: SDImageLoaderProgressBlock?
  ) async throws -> (Data, SDImageCacheType) {
    // Local files are already on disk — there is nothing to cache and nothing to download.
    if url.isFileURL {
      return (try Data(contentsOf: url), .none)
    }
    if let cached = await diskDocument(forKey: cacheKey) {
      return (cached, .disk)
    }
    let downloaded = try await download(url, context: context, progress: progress)
    // Cache the original document, never the substituted one.
    SDImageCache.shared.storeImageData(toDisk: downloaded, forKey: cacheKey)
    return (downloaded, .none)
  }

  private func diskDocument(forKey key: String) async -> Data? {
    await withCheckedContinuation { continuation in
      SDImageCache.shared.diskImageDataQuery(forKey: key) { data in
        continuation.resume(returning: data)
      }
    }
  }

  private func download(
    _ url: URL,
    context: SDWebImageContext,
    progress: SDImageLoaderProgressBlock?
  ) async throws -> Data {
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
            context: context,
            progress: progress
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

  /// Substitutes the variables and parses the document. `nonisolated` and synchronous, so it runs on
  /// the caller's cooperative thread rather than hopping back to the main actor.
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
