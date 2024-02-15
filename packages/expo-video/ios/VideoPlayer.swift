// Copyright 2023-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

internal final class VideoPlayer: SharedRef<AVPlayer> {
  override init(_ pointer: AVPlayer) {
    super.init(pointer)
    VideoModule.nowPlayingManager.registerPlayer(player: pointer)
  }

  deinit {
    VideoModule.nowPlayingManager.unregisterPlayer(player: pointer)
  }
}
