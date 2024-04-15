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

  internal func setAppropriateAudioSessionOrWarn() {
    let audioSession = AVAudioSession.sharedInstance()
    var audioSessionCategoryOptions: AVAudioSession.CategoryOptions = []

    let isAnyPlayerPlaying = videoPlayers.allObjects.reduce(false) { result, object in
      result || object.isPlaying
    }
    let areAllPlayersMuted = videoPlayers.allObjects.reduce(true) { result, object in
      result && object.isMuted
    }

    // When all players are muted, or none are playing, we don't want to interrupt other audio sources on the device
    if !isAnyPlayerPlaying || areAllPlayersMuted {
      audioSessionCategoryOptions.insert(.mixWithOthers)
    }

    // We should always keep the category as movie playback
    do {
      try audioSession.setCategory(.playback, mode: .moviePlayback, options: audioSessionCategoryOptions)
    } catch {
      log.warn("Failed to set audio session category. This might cause issues with audio playback and Picture in Picture. \(error.localizedDescription)")
    }

    // Make sure audio session is active if any video is playing
    if isAnyPlayerPlaying {
      do {
        try audioSession.setActive(true)
      } catch {
        log.warn("Failed to activate the audio session. This might cause issues with audio playback. \(error.localizedDescription)")
      }
    }
  }
}
