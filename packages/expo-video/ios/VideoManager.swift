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
  private var mediaServicesResetObserver: NSObjectProtocol?
  private var videoViews = NSHashTable<VideoView>.weakObjects()
  private let videoPlayers = SynchronizedHashTable<VideoPlayer>(weakObjects: true)

  var hasRegisteredPlayers: Bool {
    return !videoPlayers.allObjects.isEmpty
  }

  private init() {
    // When the system resets media services all audio/video objects become invalid. We have to
    // re-establish the audio session and rebuild every player's item, otherwise they stay in a
    // failed state and `AVPlayerViewController` keeps showing its broken-playback placeholder.
    mediaServicesResetObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.mediaServicesWereResetNotification,
      object: nil,
      queue: nil
    ) { [weak self] _ in
      self?.onMediaServicesWereReset()
    }
  }

  deinit {
    if let mediaServicesResetObserver {
      NotificationCenter.default.removeObserver(mediaServicesResetObserver)
    }
  }

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
    // While the app is backgrounded iOS can release the decode pipeline, leaving items in a
    // `.failed` state once we come back.
    reloadPlayers { $0.reloadIfFailed() }
  }

  private func onMediaServicesWereReset() {
    setAppropriateAudioSessionOrWarn()
    reloadPlayers { $0.reloadCurrentSource() }
  }

  private func reloadPlayers(_ reload: @escaping (VideoPlayer) -> Void) {
    Self.managerQueue.async { [weak self] in
      guard let self else {
        return
      }

      let players = self.videoPlayers.allObjects

      DispatchQueue.main.async {
        for player in players {
          reload(player)
        }
      }
    }
  }

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
    let policy = AudioSessionPolicy.evaluate(
      category: audioSession.category,
      mode: audioSession.mode,
      options: audioSession.categoryOptions,
      players: videoPlayers.allObjects.map { player in
        AudioSessionPolicy.PlayerState(
          isPlaying: player.isPlaying,
          isMuted: player.isMuted,
          showNowPlayingNotification: player.showNowPlayingNotification,
          audioMixingMode: player.audioMixingMode
        )
      }
    )

    if audioSession.categoryOptions != policy.options || audioSession.category != policy.category || audioSession.mode != policy.mode {
      do {
        try audioSession.setCategory(policy.category, mode: policy.mode, options: policy.options)
      } catch {
        log.warn("[expo-video] Failed to set audio session category. This might cause issues with audio playback and Picture in Picture. \(error.localizedDescription)")
      }
    }

    if policy.shouldActivate {
      do {
        try audioSession.setActive(true)
      } catch {
        log.warn("[expo-video] Failed to activate the audio session. This might cause issues with audio playback. \(error.localizedDescription)")
      }
    }
  }
}
