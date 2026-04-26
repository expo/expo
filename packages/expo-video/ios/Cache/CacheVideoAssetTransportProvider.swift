import ExpoModulesCore

internal final class CacheVideoAssetTransportProvider: VideoAssetTransportProvider {
  let identifier = "expo-video.cache"
  let priority = -100

  func makeLoadPlan(for source: VideoAssetSourceDescriptor) -> VideoAssetLoadPlan? {
    guard source.usesCaching else {
      return nil
    }

    let cachedMimeType = MediaInfo(forResourceUrl: source.url)?.mimeType
    let cachedExtension = mimeTypeToExtension(mimeType: cachedMimeType) ?? ""
    let fileExtension = source.url.pathExtension.isEmpty ? cachedExtension : source.url.pathExtension
    guard let saveFilePath = VideoAsset.pathForUrl(url: source.url, fileExtension: fileExtension) else {
      log.warn("[expo-video] Failed to create a cache file path for the provided source with uri: \(source.url.absoluteString)")
      return nil
    }

    guard canCache(source: source) else {
      log.warn("[expo-video] Provided source with uri: \(source.url.absoluteString) cannot be cached. Caching will be disabled")
      return nil
    }

    guard let urlWithCustomScheme = source.url.withScheme(VideoCacheManager.expoVideoCacheScheme) else {
      log.warn("[expo-video] CachingPlayerItem error: Urls without a scheme are not supported, the resource won't be cached")
      return nil
    }

    VideoCacheManager.shared.ensureCacheIntegrity(forSavePath: saveFilePath)
    VideoAsset.createCacheDirectoryIfNeeded()

    let delegate = ResourceLoaderDelegate(
      url: source.url,
      saveFilePath: saveFilePath,
      fileExtension: fileExtension,
      urlRequestHeaders: source.headers
    )

    return VideoAssetLoadPlan(
      assetURL: urlWithCustomScheme,
      assetOptions: VideoAsset.assetOptions(headers: source.headers),
      resourceLoaderDelegate: delegate,
      resourceLoaderQueue: VideoCacheManager.shared.cacheQueue,
      attachErrorHandler: { errorHandler in
        delegate.onError = errorHandler
      },
      onAssetDeinit: {
        if let cachedFileUrl = URL(string: saveFilePath) {
          VideoCacheManager.shared.unregisterOpenFile(at: cachedFileUrl)
        }
        VideoCacheManager.shared.ensureCacheSize()
      }
    )
  }

  private func canCache(source: VideoAssetSourceDescriptor) -> Bool {
    guard source.url.scheme?.starts(with: "http") == true else {
      return false
    }

    return !source.hasDRM
  }
}
