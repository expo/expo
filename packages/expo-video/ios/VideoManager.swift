// Copyright 2024-present 650 Industries. All rights reserved.

import AVKit
import Foundation
import ExpoModulesCore

/**
 * Helper class used to keep track of all existing VideoViews and VideoPlayers and manage their lifecycle
 */
class VideoManager {
  static var shared = VideoManager()

  private static var managerQueue = DispatchQueue(label: "com.expo.video.manager.managerQueue")
  private var videoViews = NSHashTable<VideoView>.weakObjects()
  private var videoPlayers = NSHashTable<VideoPlayer>.weakObjects()

  var hasRegisteredPlayers: Bool {
    return !videoPlayers.allObjects.isEmpty
  }

  func register(videoPlayer: VideoPlayer) {
    Self.managerQueue.async { [weak self, weak videoPlayer] in
      guard let self = self, let videoPlayer = videoPlayer else {
        return
      }
      self.videoPlayers.add(videoPlayer)
    }
  }

  func unregister(videoPlayer: VideoPlayer) {
    Self.managerQueue.async { [weak self, weak videoPlayer] in
      guard let self = self, let videoPlayer = videoPlayer else {
        return
      }
      self.videoPlayers.remove(videoPlayer)
    }
  }

  func register(videoView: VideoView) {
    videoViews.add(videoView)
  }

  func unregister(videoView: VideoView) {
    videoViews.remove(videoView)
  }

  func onAppForegrounded() {}

  func onAppBackgrounded() {
    for videoView in videoViews.allObjects {
      guard let player = videoView.player else {
        continue
      }
      if player.staysActiveInBackground == true {
        player.ref.audiovisualBackgroundPlaybackPolicy = .continuesIfPossible
      } else if !videoView.playerViewController.isInPictureInPicture {
        player.ref.audiovisualBackgroundPlaybackPolicy = .pauses
        player.ref.pause()
      }
    }
  }

  // MARK: - Audio Session Management

  // This function usually takes less than 5ms to execute, but in some cases (initial setup) it takes up to 70ms
  // Because of this we dispatch it on another queue to minimize the load on main queue.
  internal func setAppropriateAudioSessionOrWarn() {
    Self.managerQueue.async { [weak self] in
      self?.setAudioSession()
    }
  }

  private func setAudioSession() {
    let audioSession = AVAudioSession.sharedInstance()
    let audioMixingMode = findAudioMixingMode()
    var audioSessionCategoryOptions: AVAudioSession.CategoryOptions = audioSession.categoryOptions

    let isOutputtingAudio = videoPlayers.allObjects.contains { player in
      player.isPlaying && !player.isMuted
    }
    let anyPlayerShowsNotification = videoPlayers.allObjects.contains { player in
      player.showNowPlayingNotification
    }

    let shouldMixOverride = audioMixingMode == .mixWithOthers
    let doNotMixOverride = audioMixingMode == .doNotMix
    let shouldDuckOthers = audioMixingMode == .duckOthers && isOutputtingAudio

    // The now playing notification won't be shown if we allow the audio to mix with others
    let autoShouldMix = !isOutputtingAudio && !anyPlayerShowsNotification
    let shouldMixWithOthers = shouldMixOverride || autoShouldMix

    if shouldMixWithOthers && !shouldDuckOthers && !doNotMixOverride {
      audioSessionCategoryOptions.insert(.mixWithOthers)
    } else {
      audioSessionCategoryOptions.remove(.mixWithOthers)
    }

    if shouldDuckOthers && !doNotMixOverride {
      audioSessionCategoryOptions.insert(.duckOthers)
    } else {
      audioSessionCategoryOptions.remove(.duckOthers)
    }

    if audioSession.categoryOptions != audioSessionCategoryOptions || audioSession.category != .playback || audioSession.mode != .moviePlayback {
      do {
        try audioSession.setCategory(.playback, mode: .moviePlayback, options: audioSessionCategoryOptions)
      } catch {
        log.warn("Failed to set audio session category. This might cause issues with audio playback and Picture in Picture. \(error.localizedDescription)")
      }
    }

    // Make sure audio session is active if any video is playing
    if isOutputtingAudio || doNotMixOverride {
      do {
        try audioSession.setActive(true)
      } catch {
        log.warn("Failed to activate the audio session. This might cause issues with audio playback. \(error.localizedDescription)")
      }
    }
  }

  private func findAudioMixingMode() -> AudioMixingMode? {
    let playingPlayers = videoPlayers.allObjects.filter({ player in
      player.isPlaying
    })
    var audioMixingMode: AudioMixingMode = .mixWithOthers

    if playingPlayers.isEmpty {
      return nil
    }
    for videoPlayer in playingPlayers where (audioMixingMode.priority()) < videoPlayer.audioMixingMode.priority() {
      audioMixingMode = videoPlayer.audioMixingMode
    }
    return audioMixingMode
  }
}
