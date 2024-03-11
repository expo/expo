// Copyright 2023-present 650 Industries. All rights reserved.

import AVFoundation
import MediaPlayer
import ExpoModulesCore

internal final class VideoPlayer: SharedRef<AVPlayer>, Hashable {
  lazy var contentKeyManager = ContentKeyManager()

  var loop = false {
    didSet {
      applyIsLooping()
    }
  }

  var playbackRate: Float = 1.0 {
    didSet {
      if #available(iOS 16.0, *) {
        pointer.defaultRate = playbackRate
      }
      if pointer.rate != 0 {
        pointer.rate = playbackRate
      }
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

  private var playerItemObserver: NSObjectProtocol?
  private var playerRateObserver: NSObjectProtocol?

  override init(_ pointer: AVPlayer) {
    super.init(pointer)
    NowPlayingManager.shared.registerPlayer(pointer)
    VideoManager.shared.register(videoPlayer: self)

    playerRateObserver = pointer.observe(\.rate, options: [.new]) {[weak self] _, change in
      guard let newRate = change.newValue, let self else {
        return
      }

      if #available(iOS 16.0, *) {
        if self.pointer.defaultRate != playbackRate {
          // User changed the playback speed in the native controls. Update the desiredRate variable
          self.playbackRate = self.pointer.defaultRate
        }
      } else if newRate != 0 && newRate != playbackRate {
        // On iOS < 16 play() method always returns the reate to 1.0, we have to keep resetting it back to desiredRate
        self.pointer.rate = playbackRate
      }
    }
  }

  deinit {
    NowPlayingManager.shared.unregisterPlayer(pointer)
    VideoManager.shared.unregister(videoPlayer: self)
  }

  func replaceCurrentItem(with videoSource: VideoSource?) throws {
    guard
      let videoSource = videoSource,
      let url = videoSource.uri
    else {
      pointer.replaceCurrentItem(with: nil)
      applyIsLooping()
      return
    }

    let asset = AVURLAsset(url: url)
    let playerItem = AVPlayerItem(asset: asset)
    playerItem.audioTimePitchAlgorithm = preservesPitch ? .spectral : .varispeed

    if let drm = videoSource.drm {
      try drm.type.assertIsSupported()
      contentKeyManager.addContentKeyRequest(videoSource: videoSource, asset: asset)
    }

    pointer.replaceCurrentItem(with: playerItem)
    applyIsLooping()
  }

  private func applyIsLooping() {
    NotificationCenter.default.removeObserver(playerItemObserver)
    playerItemObserver = nil

    if let currentItem = pointer.currentItem, loop {
      playerItemObserver = NotificationCenter.default.addObserver(
        forName: NSNotification.Name.AVPlayerItemDidPlayToEndTime,
        object: pointer.currentItem,
        queue: nil
      ) { [weak self] _ in
        self?.pointer.seek(to: .zero)
        self?.pointer.play()
      }
    }
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
