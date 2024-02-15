// Copyright 2024-present 650 Industries. All rights reserved.

import AVKit
import Foundation

class VideoViewManager {
  private var videoViews = Set<VideoView>()

  func register(videoView: VideoView) {
    videoViews.insert(videoView)
  }

  func unregister(videoView: VideoView) {
    videoViews.remove(videoView)
  }

  func onAppForegrounded() {
    for videoView in videoViews {
      videoView.onAppForegrounded()
    }
  }

  func onAppBackgrounded() {
    for videoView in videoViews {
      videoView.onAppBackgrounded()
    }
  }
}
