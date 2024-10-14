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
        safeEmit(event: "playbackRateChange", arguments: playbackRate, oldValue)
      }
      if #available(iOS 16.0, tvOS 16.0, *) {
        pointer.defaultRate = playbackRate
      }
      pointer.rate = playbackRate
    }
  }

  var staysActiveInBackground = false {
    didSet {
      if staysActiveInBackground {
        VideoManager.shared.setAppropriateAudioSessionOrWarn()
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

        safeEmit(event: "volumeChange", arguments: newVolumeEvent, oldVolumeEvent)
      }
      pointer.volume = volume
    }
  }

  var isMuted: Bool = false {
    didSet {
      if oldValue != isMuted {
        let oldVolumeEvent = VolumeEvent(volume: volume, isMuted: oldValue)
        let newVolumeEvent = VolumeEvent(volume: volume, isMuted: isMuted)

        safeEmit(event: "volumeChange", arguments: newVolumeEvent, oldVolumeEvent)
      }
      pointer.isMuted = isMuted
      VideoManager.shared.setAppropriateAudioSessionOrWarn()
    }
  }

  var showNowPlayingNotification = false {
    didSet {
      // The audio session needs to be appropriate before displaying the notfication
      VideoManager.shared.setAppropriateAudioSessionOrWarn()

      if showNowPlayingNotification {
        NowPlayingManager.shared.registerPlayer(self)
      } else {
        NowPlayingManager.shared.unregisterPlayer(self)
      }
    }
  }

  // TODO: @behenate - Once the Player instance is available in OnStartObserving we can automatically start/stop the interval.
  var timeUpdateEventInterval: Double = 0 {
    didSet {
      if timeUpdateEventInterval <= 0 {
        observer?.stopTimeUpdates()
        return
      }
      observer?.startOrUpdateTimeUpdates(forInterval: timeUpdateEventInterval)
    }
  }

  var currentLiveTimestamp: Double? {
    guard let currentDate = pointer.currentItem?.currentDate() else {
      return nil
    }
    let timeIntervalSince = currentDate.timeIntervalSince1970
    return Double(timeIntervalSince * 1000)
  }

  var currentOffsetFromLive: Double? {
    guard let currentDate = pointer.currentItem?.currentDate() else {
      return nil
    }
    let timeIntervalSince = currentDate.timeIntervalSince1970
    let unixTime = Date().timeIntervalSince1970
    return unixTime - timeIntervalSince
  }

  var bufferOptions = BufferOptions() {
    didSet {
      pointer.currentItem?.preferredForwardBufferDuration = bufferOptions.preferredForwardBufferDuration
      pointer.automaticallyWaitsToMinimizeStalling = bufferOptions.waitsToMinimizeStalling
    }
  }

  var bufferedPosition: Double {
    return getBufferedPosition()
  }

  override init(_ pointer: AVPlayer) {
    super.init(pointer)
    observer = VideoPlayerObserver(owner: self)
    observer?.registerDelegate(delegate: self)
    VideoManager.shared.register(videoPlayer: self)
  }

  deinit {
    observer?.cleanup()
    NowPlayingManager.shared.unregisterPlayer(self)
    VideoManager.shared.unregister(videoPlayer: self)

    // The current item has to be replaced with nil from the main thread. When replacing from the SharedObjectRegistry queue
    // sometimes the KVOs used by AVPlayerViewController would try to deliver updates about the item being changed to nil after the
    // player was deallocated, which caused crashes.
    DispatchQueue.main.async { [pointer] in
      pointer.replaceCurrentItem(with: nil)
    }
  }

  func replaceCurrentItem(with videoSource: VideoSource?) throws {
    guard
      let videoSource = videoSource,
      let url = videoSource.uri
    else {
      pointer.replaceCurrentItem(with: nil)
      return
    }

    let asset = if let headers = videoSource.headers {
      AVURLAsset(url: url, options: ["AVURLAssetHTTPHeaderFieldsKey": headers])
    } else {
      AVURLAsset(url: url)
    }
    let playerItem = VideoPlayerItem(asset: asset, videoSource: videoSource)

    if let drm = videoSource.drm {
      try drm.type.assertIsSupported()
      contentKeyManager.addContentKeyRequest(videoSource: videoSource, asset: asset)
    }

    playerItem.audioTimePitchAlgorithm = preservesPitch ? .spectral : .varispeed
    playerItem.preferredForwardBufferDuration = bufferOptions.preferredForwardBufferDuration
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

  private func getBufferedPosition() -> Double {
    guard let currentItem = pointer.currentItem else {
      return -1
    }
    let currentTime = pointer.currentTime().seconds

    for timeRange in currentItem.loadedTimeRanges {
      let start = CMTimeGetSeconds(timeRange.timeRangeValue.start)
      let end = CMTimeGetSeconds(timeRange.timeRangeValue.end)
      if start <= currentTime && end >= currentTime {
        return end
      }
    }
    return 0
  }

  // MARK: - VideoPlayerObserverDelegate

  func onStatusChanged(player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?) {
    let errorRecord = error != nil ? PlaybackError(message: error?.localizedDescription) : nil
    safeEmit(event: "statusChange", arguments: newStatus.rawValue, oldStatus?.rawValue, errorRecord)
    status = newStatus
  }

  func onIsPlayingChanged(player: AVPlayer, oldIsPlaying: Bool?, newIsPlaying: Bool) {
    safeEmit(event: "playingChange", arguments: newIsPlaying, oldIsPlaying)
    isPlaying = newIsPlaying

    VideoManager.shared.setAppropriateAudioSessionOrWarn()
  }

  func onRateChanged(player: AVPlayer, oldRate: Float?, newRate: Float) {
    if #available(iOS 16.0, tvOS 16.0, *) {
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
    safeEmit(event: "playToEnd")
    if loop {
      self.pointer.seek(to: .zero)
      self.pointer.play()
    }
  }

  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?) {
    safeEmit(event: "sourceChange", arguments: newVideoPlayerItem?.videoSource, oldVideoPlayerItem?.videoSource)
    newVideoPlayerItem?.preferredForwardBufferDuration = bufferOptions.preferredForwardBufferDuration
  }

  func onTimeUpdate(player: AVPlayer, timeUpdate: TimeUpdate) {
    safeEmit(event: "timeUpdate", arguments: timeUpdate)
  }

  func safeEmit<each A: AnyArgument>(event: String, arguments: repeat each A) {
    if self.appContext != nil {
      self.emit(event: event, arguments: repeat each arguments)
    }
  }

  // MARK: - Hashable

  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }

  static func == (lhs: VideoPlayer, rhs: VideoPlayer) -> Bool {
    return ObjectIdentifier(lhs) == ObjectIdentifier(rhs)
  }
}
