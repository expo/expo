// Copyright 2023-present 650 Industries. All rights reserved.

import AVFoundation
import MediaPlayer
import ExpoModulesCore

internal final class VideoPlayer: SharedRef<AVPlayer>, Hashable, VideoPlayerObserverDelegate {
  lazy var contentKeyManager = ContentKeyManager()
  var observer: VideoPlayerObserver?
  lazy var subtitles: VideoPlayerSubtitles = VideoPlayerSubtitles(owner: self)

  var loop = false
  var audioMixingMode: AudioMixingMode = .doNotMix {
    didSet {
      if oldValue != audioMixingMode {
        VideoManager.shared.setAppropriateAudioSessionOrWarn()
      }
    }
  }
  private(set) var isPlaying = false
  private(set) var status: PlayerStatus = .idle
  var playbackRate: Float = 1.0 {
    didSet {
      if oldValue != playbackRate {
        let payload = PlaybackRateChangedEventPayload(playbackRate: playbackRate, oldPlaybackRate: oldValue)
        safeEmit(event: "playbackRateChange", payload: payload)
      }
      if #available(iOS 16.0, tvOS 16.0, *) {
        ref.defaultRate = playbackRate
      }
      ref.rate = playbackRate
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
      ref.currentItem?.audioTimePitchAlgorithm = preservesPitch ? .spectral : .varispeed
    }
  }

  var volume: Float = 1.0 {
    didSet {
      if oldValue != volume {
        let payload = VolumeChangedEventPayload(volume: volume, oldVolume: oldValue)
        safeEmit(event: "volumeChange", payload: payload)
      }
      ref.volume = volume
    }
  }

  var isMuted: Bool = false {
    didSet {
      if oldValue != isMuted {
        let payload = MutedChangedEventPayload(muted: isMuted, oldMuted: oldValue)
        safeEmit(event: "mutedChange", payload: payload)
      }
      ref.isMuted = isMuted
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
    guard let currentDate = ref.currentItem?.currentDate() else {
      return nil
    }
    let timeIntervalSince = currentDate.timeIntervalSince1970
    return Double(timeIntervalSince * 1000)
  }

  var currentOffsetFromLive: Double? {
    guard let currentDate = ref.currentItem?.currentDate() else {
      return nil
    }
    let timeIntervalSince = currentDate.timeIntervalSince1970
    let unixTime = Date().timeIntervalSince1970
    return unixTime - timeIntervalSince
  }

  var bufferOptions = BufferOptions() {
    didSet {
      ref.currentItem?.preferredForwardBufferDuration = bufferOptions.preferredForwardBufferDuration
      ref.automaticallyWaitsToMinimizeStalling = bufferOptions.waitsToMinimizeStalling
    }
  }

  var bufferedPosition: Double {
    return getBufferedPosition()
  }

  private(set) var availableVideoTracks: [VideoTrack] = []
  private(set) var currentVideoTrack: VideoTrack? {
    didSet {
      let payload = VideoTrackChangedEventPayload(videoTrack: currentVideoTrack, oldVideoTrack: oldValue)
      safeEmit(event: "videoTrackChange", payload: payload)
    }
  }

  override init(_ ref: AVPlayer) {
    super.init(ref)
    observer = VideoPlayerObserver(owner: self)
    observer?.registerDelegate(delegate: self)
    VideoManager.shared.register(videoPlayer: self)

    // Disable automatic subtitle selection
    let selectionCriteria = AVPlayerMediaSelectionCriteria(preferredLanguages: [], preferredMediaCharacteristics: [.legible])
    ref.setMediaSelectionCriteria(selectionCriteria, forMediaCharacteristic: .legible)
  }

  deinit {
    observer?.cleanup()
    NowPlayingManager.shared.unregisterPlayer(self)
    VideoManager.shared.unregister(videoPlayer: self)

    try? self.replaceCurrentItem(with: nil)
  }

  func replaceCurrentItem(with videoSource: VideoSource?) throws {
    guard
      let videoSource = videoSource,
      let url = videoSource.uri
    else {
      DispatchQueue.main.async { [ref] in
        ref.replaceCurrentItem(with: nil)
      }
      return
    }

    let playerItem = if let headers = videoSource.headers {
      VideoPlayerItem(url: url, videoSource: videoSource, avUrlAssetOptions: ["AVURLAssetHTTPHeaderFieldsKey": headers])
    } else {
      VideoPlayerItem(url: url, videoSource: videoSource, avUrlAssetOptions: nil)
    }

    ref.automaticallyWaitsToMinimizeStalling = false

    if let drm = videoSource.drm {
      try drm.type.assertIsSupported()
      contentKeyManager.addContentKeyRequest(videoSource: videoSource, asset: playerItem.urlAsset)
    }

    playerItem.audioTimePitchAlgorithm = preservesPitch ? .spectral : .varispeed
    playerItem.preferredForwardBufferDuration = bufferOptions.preferredForwardBufferDuration

    // The current item has to be replaced from the main thread. When replacing from other queues
    // sometimes the KVOs will try to deliver updates after the item has been changed or player deallocated,
    // which causes crashes.
    DispatchQueue.main.async { [weak self] in
      self?.ref.replaceCurrentItem(with: playerItem)
    }
  }

  /**
   * iOS automatically pauses videos when the app enters the background. Only way to avoid this is to detach the player from the playerLayer.
   * Typical way of doing this for `AVPlayerViewController` is setting `playerViewController.player = nil`, but that makes the
   * video invisible for around a second after foregrounding, disabling the tracks requires more code, but works a lot faster.
   */
  func setTracksEnabled(_ enabled: Bool) {
    ref.currentItem?.tracks.forEach({ track in
      guard let assetTrack = track.assetTrack else {
        return
      }

      if assetTrack.hasMediaCharacteristic(AVMediaCharacteristic.visual) {
        track.isEnabled = enabled
      }
    })
  }

  private func getBufferedPosition() -> Double {
    guard let currentItem = ref.currentItem else {
      return -1
    }
    let currentTime = ref.currentTime().seconds

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
    let errorRecord = error != nil ? PlaybackError(message: error?.description) : nil
    let payload = StatusChangedEventPayload(status: newStatus, oldStatus: oldStatus, error: errorRecord)
    safeEmit(event: "statusChange", payload: payload)
    status = newStatus
  }

  func onIsPlayingChanged(player: AVPlayer, oldIsPlaying: Bool?, newIsPlaying: Bool) {
    let payload = IsPlayingEventPayload(isPlaying: newIsPlaying, oldIsPlaying: oldIsPlaying)
    safeEmit(event: "playingChange", payload: payload)
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
      ref.rate = playbackRate
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
      self.ref.seek(to: .zero)
      self.ref.play()
    }
  }

  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?) {
    let payload = SourceChangedEventPayload(
      source: newVideoPlayerItem?.videoSource,
      oldSource: oldVideoPlayerItem?.videoSource
    )
    safeEmit(event: "sourceChange", payload: payload)
    newVideoPlayerItem?.preferredForwardBufferDuration = bufferOptions.preferredForwardBufferDuration
  }

  func onTimeUpdate(player: AVPlayer, timeUpdate: TimeUpdate) {
    safeEmit(event: "timeUpdate", payload: timeUpdate)
  }

  func onLoadedPlayerItem(player: AVPlayer, playerItem: AVPlayerItem?) {
    // This event means that a new player item has been loaded so the subtitle tracks should change
    let oldTracks = subtitles.availableSubtitleTracks
    self.subtitles.onNewPlayerItemLoaded(playerItem: playerItem)
    let payload = SubtitleTracksChangedEventPayload(
      availableSubtitleTracks: subtitles.availableSubtitleTracks,
      oldAvailableSubtitleTracks: oldTracks
    )
    safeEmit(event: "availableSubtitleTracksChange", payload: payload)

    Task {
      let videoPlayerItem: VideoPlayerItem? = playerItem as? VideoPlayerItem
      // Those properties will be already loaded 99.9% of time, so the event delay should be almost 0
      availableVideoTracks = await videoPlayerItem?.videoTracks ?? []

      let videoSourceLoadedPayload = VideoSourceLoadedEventPayload(
        videoSource: videoPlayerItem?.videoSource,
        duration: playerItem?.duration.seconds,
        availableVideoTracks: availableVideoTracks,
        availableSubtitleTracks: subtitles.availableSubtitleTracks
      )
      safeEmit(event: "sourceLoad", payload: videoSourceLoadedPayload)
    }
  }

  func onSubtitleSelectionChanged(player: AVPlayer, playerItem: AVPlayerItem?, subtitleTrack: SubtitleTrack?) {
    let oldTrack = subtitles.currentSubtitleTrack
    subtitles.onNewSubtitleTrackSelected(subtitleTrack: subtitleTrack)
    let payload = SubtitleTrackChangedEventPayload(subtitleTrack: subtitles.currentSubtitleTrack, oldSubtitleTrack: oldTrack)
    safeEmit(event: "subtitleTrackChange", payload: payload)
  }

  func onVideoTrackChanged(player: AVPlayer, oldVideoTrack: VideoTrack?, newVideoTrack: VideoTrack?) {
    currentVideoTrack = newVideoTrack
  }

  func safeEmit(event: String, payload: Record? = nil) {
    if self.appContext != nil {
      self.emit(event: event, arguments: payload?.toDictionary(appContext: appContext))
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
