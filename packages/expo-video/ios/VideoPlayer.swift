// Copyright 2023-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

internal final class VideoPlayer: SharedRef<AVPlayer>, Hashable {
  lazy var contentKeyManager = ContentKeyManager()

  var staysActiveInBackground = false {
    didSet {
      if staysActiveInBackground {
        VideoManager.shared.switchToActiveAudioSessionOrWarn(
          warning: "Failed to set the audio session category. This might affect background playback functionality"
        )
      }
    }
  }

  override init(_ pointer: AVPlayer) {
    super.init(pointer)
    NowPlayingManager.shared.registerPlayer(pointer)
    VideoManager.shared.register(videoPlayer: self)
  }

  deinit {
    NowPlayingManager.shared.unregisterPlayer(pointer)
    VideoManager.shared.unregister(videoPlayer: self)
  }

  /**
   * iOS automatically pauses videos when the app enters the background. Only way to avoid this is to detach the player from the playerLayer.
   * Typical way of doing this for `AVPlayerViewController` is setting `playerViewController.player = nil`, but that makes the
   * video invisible for around a second after foregrounding, disabling the tracks requires more code, but works a lot faster.
   */
  func setTracksEnabled(_ enabled: Bool) {
    pointer.currentItem?.tracks.forEach({ track in
      guard let assetTrack = track.assetTrack else {
        return
      }

      if assetTrack.hasMediaCharacteristic(AVMediaCharacteristic.visual) {
        track.isEnabled = enabled
      }
    })
  }

  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }

  static func == (lhs: VideoPlayer, rhs: VideoPlayer) -> Bool {
    return ObjectIdentifier(lhs) == ObjectIdentifier(rhs)
  }
}
