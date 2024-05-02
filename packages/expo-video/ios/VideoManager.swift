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

    let isAnyPlayerPlaying = videoPlayers.allObjects.contains { player in
      player.isPlaying
    }
    let areAllPlayersMuted = videoPlayers.allObjects.allSatisfy { player in
      player.isMuted
    }
    let needsPiPSupport = videoViews.allObjects.contains { view in
      view.allowPictureInPicture
    }
    let anyPlayerShowsNotification = videoPlayers.allObjects.contains { player in
      player.showNowPlayingNotification
    }
    // The notification won't be shown if we allow the audio to mix with others
    let shouldAllowMixing = (!isAnyPlayerPlaying || areAllPlayersMuted) && !anyPlayerShowsNotification
    let isOutputtingAudio = !areAllPlayersMuted && isAnyPlayerPlaying
    let shouldUpdateToAllowMixing = !audioSession.categoryOptions.contains(.mixWithOthers) && shouldAllowMixing

    if shouldAllowMixing {
      audioSessionCategoryOptions.insert(.mixWithOthers)
    }

    if isOutputtingAudio || needsPiPSupport || shouldUpdateToAllowMixing || anyPlayerShowsNotification {
      do {
        try audioSession.setCategory(.playback, mode: .moviePlayback)
      } catch {
        log.warn("Failed to set audio session category. This might cause issues with audio playback and Picture in Picture. \(error.localizedDescription)")
      }
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
