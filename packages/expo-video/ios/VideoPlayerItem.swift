// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation

class VideoPlayerItem: CachingPlayerItem {
  let videoSource: VideoSource

  init(url: URL, videoSource: VideoSource, avUrlAssetOptions: [String: Any]? = nil) {
//  init(asset: AVAsset, videoSource: VideoSource) {
    self.videoSource = videoSource
//    super.init(asset: asset, automaticallyLoadedAssetKeys: nil)
    super.init(url: url, avUrlAssetOptions: avUrlAssetOptions)
  }
}
