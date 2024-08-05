// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation

class VideoPlayerItem: CachingPlayerItem {
  let videoSource: VideoSource

  init(url: URL, videoSource: VideoSource, avUrlAssetOptions: [String: Any]? = nil) {
    self.videoSource = videoSource
    super.init(url: url, useCaching: videoSource.useCaching, avUrlAssetOptions: avUrlAssetOptions)
  }
}
