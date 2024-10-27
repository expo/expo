// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation

class VideoPlayerItem: AVPlayerItem {
  let videoSource: VideoSource
  init(asset: AVAsset, videoSource: VideoSource) {
    self.videoSource = videoSource
    super.init(asset: asset, automaticallyLoadedAssetKeys: nil)
  }
}
