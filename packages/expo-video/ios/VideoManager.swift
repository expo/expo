// Copyright 2024-present 650 Industries. All rights reserved.

import AVKit
import Foundation
import ExpoModulesCore

/**
 * Helper class used to keep track of all existing VideoViews and VideoPlayers and manage their lifecycle
 */
class VideoManager {
  static var shared = VideoManager()

  private var videoViews = NSHashTable<VideoView>.weakObjects()
  private var videoPlayers = NSHashTable<VideoPlayer>.weakObjects()

  func register(videoPlayer: VideoPlayer) {
    videoPlayers.add(videoPlayer)
  }

  func unregister(videoPlayer: VideoPlayer) {
    videoPlayers.remove(videoPlayer)
  }

  func register(videoView: VideoView) {
    videoViews.add(videoView)
  }

  func unregister(videoView: VideoView) {
    videoViews.remove(videoView)
  }

  func onAppForegrounded() {
    for videoPlayer in videoPlayers.allObjects {
      videoPlayer.setTracksEnabled(true)
    }
  }

  func onAppBackgrounded() {
    for videoView in videoViews.allObjects {
      guard let player = videoView.player else {
        continue
      }
      if player.staysActiveInBackground == true {
        player.setTracksEnabled(videoView.isInPictureInPicture)
      } else if !videoView.isInPictureInPicture {
        player.pointer.pause()
      }
    }
  }

  // MARK: - Audio Session Management

  private func switchToActiveAudioSession() throws {
    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(.playback, mode: .moviePlayback)
    try audioSession.setActive(true)
  }

  internal func switchToActiveAudioSessionOrWarn(warning: String) {
    do {
      try switchToActiveAudioSession()
    } catch {
      log.warn("\(warning). \(error.localizedDescription)")
    }
  }
}
