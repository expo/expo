// Copyright 2023-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore
import MediaPlayer

internal final class VideoPlayer: SharedRef<AVPlayer>, Hashable, VideoPlayerObserverDelegate {
  let videoSourceLoader = VideoSourceLoader()
  lazy var contentKeyManager = ContentKeyManager()
  var observer: VideoPlayerObserver?
  lazy var subtitles: VideoPlayerSubtitles = VideoPlayerSubtitles(owner: self)
  private var dangerousPropertiesStore = DangerousPropertiesStore()
  lazy var audioTracks: VideoPlayerAudioTracks = VideoPlayerAudioTracks(owner: self)

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

  // PIP restoration callback storage
  private var pipRestoreCallbacks: [String: Any]?
  private var pendingPipRestoreCallbacks: [String: (Bool) -> Void] = [:]

  var playbackRate: Float = 1.0 {
    didSet {
      if oldValue != playbackRate {
        let payload = PlaybackRateChangedEventPayload(
          playbackRate: playbackRate, oldPlaybackRate: oldValue)
        safeEmit(event: "playbackRateChange", payload: payload)
      }
      if #available(iOS 16.0, tvOS 16.0, *) {
        ref.defaultRate = playbackRate
      }
      ref.rate = playbackRate
    }
  }

  var currentTime: Double {
    get {
      let currentTime = ref.currentTime().seconds
      return currentTime.isNaN ? 0 : currentTime
    }
    set {
      // Only clamp the lower limit, AVPlayer automatically clamps the upper limit.
      let clampedTime = max(0, newValue)
      let timeToSeek = CMTimeMakeWithSeconds(clampedTime, preferredTimescale: .max)

      // AVPlayer can't apply the currentTime while the resource is loading. We will re-apply it after loading
      if dangerousPropertiesStore.ownerIsReplacing {
        dangerousPropertiesStore.currentTime = clampedTime
        return
      }

      ref.seek(to: timeToSeek, toleranceBefore: .zero, toleranceAfter: .zero)
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
      let payload = VideoTrackChangedEventPayload(
        videoTrack: currentVideoTrack, oldVideoTrack: oldValue)
      safeEmit(event: "videoTrackChange", payload: payload)
    }
  }

  convenience init(
    _ ref: AVPlayer, initialSource: VideoSource?, useSynchronousReplace: Bool = false
  ) throws {
    self.init(ref)

    // While the replace task below is being created, the properties from the JS constructor will start getting applied
    // Therefore we have to set the state as `loading` before the task is created to ensure that we don't lose any dangerous properties
    dangerousPropertiesStore.ownerIsReplacing = initialSource != nil

    if useSynchronousReplace {
      try replaceCurrentItem(with: initialSource)
    } else {
      Task {
        try await replaceCurrentItem(with: initialSource)
      }
    }
  }

  private override init(_ ref: AVPlayer) {
    super.init(ref)
    observer = VideoPlayerObserver(owner: self, videoSourceLoader: videoSourceLoader)
    observer?.registerDelegate(delegate: self)
    VideoManager.shared.register(videoPlayer: self)

    // Disable automatic subtitle selection
    let selectionCriteria = AVPlayerMediaSelectionCriteria(
      preferredLanguages: [], preferredMediaCharacteristics: [.legible])
    ref.setMediaSelectionCriteria(selectionCriteria, forMediaCharacteristic: .legible)
  }

  deinit {
    observer?.cleanup()
    NowPlayingManager.shared.unregisterPlayer(self)
    VideoManager.shared.unregister(videoPlayer: self)

    videoSourceLoader.cancelCurrentTask()

    // We have to replace from the main thread because of KVOs (see comment in VideoSourceLoader).
    // Moreover, in this case we have to keep a strong reference to AVPlayer and remove its item
    // If we don't do this AVPlayer doesn't get deallocated
    DispatchQueue.main.async { [ref] in
      ref.replaceCurrentItem(with: nil)
    }
  }

  func replaceCurrentItem(with videoSource: VideoSource?) throws {
    dangerousPropertiesStore.ownerIsReplacing = true
    videoSourceLoader.cancelCurrentTask()
    guard
      let videoSource = videoSource,
      let playerItem = VideoPlayerItem(videoSource: videoSource)
    else {
      clearCurrentItem()
      return
    }

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
      guard let self else {
        return
      }
      self.ref.replaceCurrentItem(with: playerItem)
      self.dangerousPropertiesStore.ownerIsReplacing = false
      self.dangerousPropertiesStore.applyProperties(to: self)
    }
  }

  /**
   * Replaces the current item, while loading the AVAsset on a different thread. The synchronous version can lock the main thread for extended periods of time.
   */
  func replaceCurrentItem(with videoSource: VideoSource?) async throws {
    guard let videoSource, videoSource.uri != nil else {
      clearCurrentItem()
      return
    }

    dangerousPropertiesStore.ownerIsReplacing = true
    guard let playerItem = try await videoSourceLoader.load(videoSource: videoSource) else {
      // Resolve the promise without applying the source. The loading task has been cancelled.
      // The caller that cancelled this task should handle dangerousPropertiesStore
      return
    }

    if let drm = videoSource.drm {
      try drm.type.assertIsSupported()
      self.contentKeyManager.addContentKeyRequest(
        videoSource: videoSource, asset: playerItem.urlAsset)
    }

    playerItem.audioTimePitchAlgorithm = self.preservesPitch ? .spectral : .varispeed
    playerItem.preferredForwardBufferDuration = self.bufferOptions.preferredForwardBufferDuration

    // The current item has to be replaced from the main thread. When replacing from other queues
    // sometimes the KVOs will try to deliver updates after the item has been changed or player deallocated,
    // which causes crashes.
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }
      self.ref.replaceCurrentItem(with: playerItem)
      dangerousPropertiesStore.ownerIsReplacing = false
      dangerousPropertiesStore.applyProperties(to: self)
    }
  }

  private func clearCurrentItem() {
    DispatchQueue.main.async { [ref, videoSourceLoader, dangerousPropertiesStore] in
      ref.replaceCurrentItem(with: nil)
      videoSourceLoader.cancelCurrentTask()
      dangerousPropertiesStore.reset()
      dangerousPropertiesStore.ownerIsReplacing = false
    }
    return
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

  func onStatusChanged(
    player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?
  ) {
    let errorRecord = error != nil ? PlaybackError(message: error?.description) : nil
    let payload = StatusChangedEventPayload(
      status: newStatus, oldStatus: oldStatus, error: errorRecord)
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

  func onItemChanged(
    player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?
  ) {
    let payload = SourceChangedEventPayload(
      source: newVideoPlayerItem?.videoSource,
      oldSource: oldVideoPlayerItem?.videoSource
    )
    safeEmit(event: "sourceChange", payload: payload)
    newVideoPlayerItem?.preferredForwardBufferDuration =
      bufferOptions.preferredForwardBufferDuration
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

    // Handle audio tracks
    let oldAudioTracks = audioTracks.availableAudioTracks
    self.audioTracks.onNewPlayerItemLoaded(playerItem: playerItem)
    let audioPayload = AudioTracksChangedEventPayload(
      availableAudioTracks: audioTracks.availableAudioTracks,
      oldAvailableAudioTracks: oldAudioTracks
    )
    safeEmit(event: "availableAudioTracksChange", payload: audioPayload)

    Task {
      let videoPlayerItem: VideoPlayerItem? = playerItem as? VideoPlayerItem
      // Those properties will be already loaded 99.9% of time, so the event delay should be almost 0
      availableVideoTracks = await videoPlayerItem?.videoTracks ?? []

      let videoSourceLoadedPayload = VideoSourceLoadedEventPayload(
        videoSource: videoPlayerItem?.videoSource,
        duration: playerItem?.duration.seconds,
        availableVideoTracks: availableVideoTracks,
        availableSubtitleTracks: subtitles.availableSubtitleTracks,
        availableAudioTracks: audioTracks.availableAudioTracks
      )
      safeEmit(event: "sourceLoad", payload: videoSourceLoadedPayload)
    }
  }

  func onSubtitleSelectionChanged(
    player: AVPlayer, playerItem: AVPlayerItem?, subtitleTrack: SubtitleTrack?
  ) {
    let oldTrack = subtitles.currentSubtitleTrack
    subtitles.onNewSubtitleTrackSelected(subtitleTrack: subtitleTrack)
    let payload = SubtitleTrackChangedEventPayload(
      subtitleTrack: subtitles.currentSubtitleTrack, oldSubtitleTrack: oldTrack)
    safeEmit(event: "subtitleTrackChange", payload: payload)
  }

  func onAudioTrackSelectionChanged(
    player: AVPlayer, playerItem: AVPlayerItem?, audioTrack: AudioTrack?
  ) {
    let oldTrack = audioTracks.currentAudioTrack
    audioTracks.onNewAudioTrackSelected(audioTrack: audioTrack)
    let payload = AudioTrackChangedEventPayload(
      audioTrack: audioTracks.currentAudioTrack, oldAudioTrack: oldTrack)
    safeEmit(event: "audioTrackChange", payload: payload)
  }

  func onVideoTrackChanged(player: AVPlayer, oldVideoTrack: VideoTrack?, newVideoTrack: VideoTrack?)
  {
    currentVideoTrack = newVideoTrack
  }

  func onIsExternalPlaybackActiveChanged(
    player: AVPlayer, oldIsExternalPlaybackActive: Bool?, newIsExternalPlaybackActive: Bool
  ) {
    let payload = IsExternalPlaybackActiveEventPayload(
      isExternalPlaybackActive: newIsExternalPlaybackActive,
      oldIsExternalPlaybackActive: oldIsExternalPlaybackActive
    )
    safeEmit(event: "isExternalPlaybackActiveChange", payload: payload)
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

  // MARK: - PIP Restoration Callbacks

  func setPipRestoreCallbacks(_ callbacks: [String: Any]) {
    self.pipRestoreCallbacks = callbacks
  }

  func clearPipRestoreCallbacks() {
    self.pipRestoreCallbacks = nil
  }

  func getPipRestoreCallbacks() -> [String: Any]? {
    return self.pipRestoreCallbacks
  }

    // Called by VideoView when PIP restoration is needed
  func handlePipRestore(completion: @escaping (Bool) -> Void) {
    guard let callbacks = pipRestoreCallbacks else {
      completion(true) // Default to allowing restoration if no callbacks set
      return
    }

    // Create unique callback ID for this restoration request
    let callbackId = UUID().uuidString
    
    // Store the completion handler for later use
    pendingPipRestoreCallbacks[callbackId] = completion

    // Create context for the callback
    let playerId = String(describing: ObjectIdentifier(self))
    let context: [String: Any] = [
      "playerId": playerId,
      "timestamp": Date().timeIntervalSince1970 * 1000, // Convert to milliseconds
      "currentTime": self.currentTime,
      "isPlaying": self.isPlaying,
      "metadata": [
        "duration": self.ref.currentItem?.duration.seconds ?? 0
      ]
    ]

    // Call the JavaScript onBeforePipRestore callback if it exists
    if callbacks["onBeforePipRestore"] != nil {
      // Emit event to JavaScript with context and callbackId
      self.emit(event: "onBeforePipRestore", arguments: [
        "context": context,
        "callbackId": callbackId
      ])
      
      // Set a timeout to prevent hanging forever
      DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) { [weak self] in
        self?.timeoutPipRestoreCallback(callbackId: callbackId)
      }
    } else {
      // No callback registered, allow restoration immediately
      pendingPipRestoreCallbacks.removeValue(forKey: callbackId)
      completion(true)
    }
  }

  // Called from JavaScript via AsyncFunction when decision is made
  func handlePipRestoreResponse(callbackId: String, decision: [String: Any]) {
    guard let completion = pendingPipRestoreCallbacks.removeValue(forKey: callbackId) else {
      // Callback already handled or timed out
      return
    }

    let allowRestore = decision["allowRestore"] as? Bool ?? true
    let delay = decision["delay"] as? Double ?? 0

    if delay > 0 {
      // Honor the delay before calling completion
      DispatchQueue.main.asyncAfter(deadline: .now() + delay / 1000.0) {
        completion(allowRestore)
      }
    } else {
      // No delay, call completion immediately
      completion(allowRestore)
    }

    // Notify about the restoration result
    let playerId = String(describing: ObjectIdentifier(self))
    let context: [String: Any] = [
      "playerId": playerId,
      "timestamp": Date().timeIntervalSince1970 * 1000,
      "currentTime": self.currentTime,
      "isPlaying": self.isPlaying
    ]

    if allowRestore {
      DispatchQueue.main.asyncAfter(deadline: .now() + (delay / 1000.0) + 0.1) {
        self.notifyPipRestoreCompleted(context: context)
      }
    } else {
      let error: [String: Any] = [
        "code": "RESTORE_REJECTED",
        "message": "PIP restoration was rejected by callback"
      ]
      self.notifyPipRestoreFailed(error: error, context: context)
    }
  }

  // Handle timeout for callbacks that don't respond
  private func timeoutPipRestoreCallback(callbackId: String) {
    guard let completion = pendingPipRestoreCallbacks.removeValue(forKey: callbackId) else {
      return // Already handled
    }

    print("PIP restore callback timed out for callbackId: \(callbackId)")
    
    // Default to allowing restoration on timeout
    completion(true)

    // Notify about timeout error
    let playerId = String(describing: ObjectIdentifier(self))
    let context: [String: Any] = [
      "playerId": playerId,
      "timestamp": Date().timeIntervalSince1970 * 1000,
      "currentTime": self.currentTime,
      "isPlaying": self.isPlaying
    ]

    let error: [String: Any] = [
      "code": "CALLBACK_TIMEOUT",
      "message": "PIP restoration callback timed out after 10 seconds"
    ]

    self.notifyPipRestoreFailed(error: error, context: context)
  }

  func notifyPipRestoreCompleted(context: [String: Any]) {
    guard let callbacks = pipRestoreCallbacks,
      callbacks["onAfterPipRestore"] != nil
    else {
      return
    }

    self.emit(event: "onAfterPipRestore", arguments: ["context": context])
  }

  func notifyPipRestoreFailed(error: [String: Any], context: [String: Any]) {
    guard let callbacks = pipRestoreCallbacks,
      callbacks["onPipRestoreFailed"] != nil
    else {
      return
    }

    let errorPayload: [String: Any] = [
      "error": error,
      "context": context,
    ]

    self.emit(event: "onPipRestoreFailed", arguments: errorPayload)
  }
}
