// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore
class VideoPlayerItem: CachingPlayerItem {
  let videoSource: VideoSource

  init(url: URL, videoSource: VideoSource, avUrlAssetOptions: [String: Any]? = nil) {
    self.videoSource = videoSource
    let canCache = Self.canCache(videoSource: videoSource)
    let shouldCache = videoSource.useCaching && canCache

    if !canCache && videoSource.useCaching {
      log.warn("Provided source with uri: \(videoSource.uri?.absoluteString ?? "null") cannot be cached. Caching will be disabled")
    }
    super.init(url: url, useCaching: shouldCache, avUrlAssetOptions: avUrlAssetOptions)
  }

  private static func canCache(videoSource: VideoSource) -> Bool {
    guard videoSource.uri?.scheme?.starts(with: "http") == true else {
      return false
    }
    return videoSource.drm == nil
  }
}
