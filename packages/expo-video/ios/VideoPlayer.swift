// Copyright 2023-present 650 Industries. All rights reserved.

import AVFoundation
import MediaPlayer
import ExpoModulesCore

internal final class VideoPlayer: SharedRef<AVPlayer>, Hashable, VideoPlayerObserverDelegate {
  lazy var contentKeyManager = ContentKeyManager()
  var observer: VideoPlayerObserver?

  var loop = false
  private(set) var isPlaying = false
  private(set) var status: PlayerStatus = .idle
  var playbackRate: Float = 1.0 {
    didSet {
      if oldValue != playbackRate {
        self.emit(event: "playbackRateChange", arguments: playbackRate, oldValue)
      }
      if #available(iOS 16.0, *) {
        pointer.defaultRate = playbackRate
      }
      pointer.rate = playbackRate
    }
  }

  var staysActiveInBackground = false {
    didSet {
      if staysActiveInBackground {
        VideoManager.shared.switchToActiveAudioSessionOrWarn(
          warning: "Failed to set the audio session category. This might affect background playback functionality"
        )
      }
    }
  }

  var preservesPitch = true {
    didSet {
      pointer.currentItem?.audioTimePitchAlgorithm = preservesPitch ? .spectral : .varispeed
    }
  }

  var volume: Float = 1.0 {
    didSet {
      if oldValue != volume {
        let oldVolumeEvent = VolumeEvent(volume: oldValue, isMuted: isMuted)
        let newVolumeEvent = VolumeEvent(volume: volume, isMuted: isMuted)

        self.emit(event: "volumeChange", arguments: newVolumeEvent, oldVolumeEvent)
      }
      pointer.volume = volume
    }
  }

  var isMuted: Bool = false {
    didSet {
      if oldValue != isMuted {
        let oldVolumeEvent = VolumeEvent(volume: volume, isMuted: oldValue)
        let newVolumeEvent = VolumeEvent(volume: volume, isMuted: isMuted)

        self.emit(event: "volumeChange", arguments: newVolumeEvent.isMuted, oldVolumeEvent.isMuted)
      }
      pointer.isMuted = isMuted
    }
  }

  override init(_ pointer: AVPlayer) {
    super.init(pointer)
    observer = VideoPlayerObserver(player: pointer, delegate: self)
    NowPlayingManager.shared.registerPlayer(pointer)
    VideoManager.shared.register(videoPlayer: self)
  }

  deinit {
    NowPlayingManager.shared.unregisterPlayer(pointer)
    VideoManager.shared.unregister(videoPlayer: self)
    pointer.replaceCurrentItem(with: nil)
  }

  func replaceCurrentItem(with videoSource: VideoSource?) throws {
    guard
      let videoSource = videoSource,
      let url = videoSource.uri
    else {
      pointer.replaceCurrentItem(with: nil)
      return
    }

    let asset = AVURLAsset(url: url)
    let playerItem = VideoPlayerItem(asset: asset, videoSource: videoSource)

    if let drm = videoSource.drm {
      try drm.type.assertIsSupported()
      contentKeyManager.addContentKeyRequest(videoSource: videoSource, asset: asset)
    }

    playerItem.audioTimePitchAlgorithm = preservesPitch ? .spectral : .varispeed
    pointer.replaceCurrentItem(with: playerItem)
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

  // MARK: - VideoPlayerObserverDelegate

  func onStatusChanged(player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?) {
    let errorRecord = error != nil ? PlaybackError(message: error?.localizedDescription) : nil
    self.emit(event: "statusChange", arguments: newStatus.rawValue, oldStatus?.rawValue, errorRecord)
    status = newStatus
  }

  func onIsPlayingChanged(player: AVPlayer, oldIsPlaying: Bool?, newIsPlaying: Bool) {
    self.emit(event: "playingChange", arguments: newIsPlaying, oldIsPlaying)
    isPlaying = newIsPlaying
  }

  func onRateChanged(player: AVPlayer, oldRate: Float?, newRate: Float) {
    if #available(iOS 16.0, *) {
      if player.defaultRate != playbackRate {
        // User changed the playback speed in the native controls. Update the desiredRate variable
        playbackRate = player.defaultRate
      }
    } else if newRate != 0 && newRate != playbackRate {
      // On iOS < 16 play() method always returns the rate to 1.0, we have to keep resetting it back to desiredRate
      // iOS < 16 uses an older player UI, so we don't have to worry about changes to the rate that come from the player UI
      pointer.rate = playbackRate
    }
  }

  func onVolumeChanged(player: AVPlayer, oldVolume: Float?, newVolume: Float) {
    volume = newVolume
  }

  func onIsMutedChanged(player: AVPlayer, oldIsMuted: Bool?, newIsMuted: Bool) {
    isMuted = newIsMuted
  }

  func onPlayedToEnd(player: AVPlayer) {
    self.emit(event: "playToEnd")
    if loop {
      self.pointer.seek(to: .zero)
      self.pointer.play()
    }
  }

  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?) {
    self.emit(event: "sourceChange", arguments: newVideoPlayerItem?.videoSource, oldVideoPlayerItem?.videoSource)
  }

  // MARK: - Hashable

  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }

  static func == (lhs: VideoPlayer, rhs: VideoPlayer) -> Bool {
    return ObjectIdentifier(lhs) == ObjectIdentifier(rhs)
  }
}
