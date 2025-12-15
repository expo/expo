// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore
import AVFoundation

private struct Weak<T: AnyObject> {
  weak var value: T?

  init(_ value: T?) {
    self.value = value
  }
}

private enum ObserverTaskKey {
  case sourceLoading
  case subtitleTrackLoad
  case audioTrackLoad
  case trackChange
}

private actor ObserverTaskManager {
  private var tasks: [ObserverTaskKey: Task<Void, Never>] = [:]

  func run(
    forKey key: ObserverTaskKey,
    operation: @escaping @Sendable () async -> Void
  ) {
    tasks[key]?.cancel()

    let newTask = Task {
      await operation()
      tasks[key] = nil
    }
    tasks[key] = newTask
  }

  func cancelAll() {
    for task in tasks.values {
      task.cancel()
    }
    tasks.removeAll()
  }
}

protocol VideoPlayerObserverDelegate: AnyObject {
  func onStatusChanged(player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?)
  func onIsPlayingChanged(player: AVPlayer, oldIsPlaying: Bool?, newIsPlaying: Bool)
  func onRateChanged(player: AVPlayer, oldRate: Float?, newRate: Float)
  func onVolumeChanged(player: AVPlayer, oldVolume: Float?, newVolume: Float)
  func onPlayedToEnd(player: AVPlayer)
  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?)
  func onIsMutedChanged(player: AVPlayer, oldIsMuted: Bool?, newIsMuted: Bool)
  func onPlayerItemStatusChanged(player: AVPlayer, oldStatus: AVPlayerItem.Status?, newStatus: AVPlayerItem.Status)
  func onTimeUpdate(player: AVPlayer, timeUpdate: TimeUpdate)
  func onAudioMixingModeChanged(player: AVPlayer, oldAudioMixingMode: AudioMixingMode, newAudioMixingMode: AudioMixingMode)
  func onSubtitleSelectionChanged(player: AVPlayer, playerItem: AVPlayerItem?, subtitleTrack: SubtitleTrack?)
  func onAudioTrackSelectionChanged(player: AVPlayer, playerItem: AVPlayerItem?, audioTrack: AudioTrack?)
  func onLoadedPlayerItem(player: AVPlayer, playerItem: AVPlayerItem?)
  func onVideoTrackChanged(player: AVPlayer, oldVideoTrack: VideoTrack?, newVideoTrack: VideoTrack?)
  func onIsExternalPlaybackActiveChanged(player: AVPlayer, oldIsExternalPlaybackActive: Bool?, newIsExternalPlaybackActive: Bool)
}

// Default implementations for the delegate
extension VideoPlayerObserverDelegate {
  func onStatusChanged(player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?) {}
  func onIsPlayingChanged(player: AVPlayer, oldIsPlaying: Bool?, newIsPlaying: Bool) {}
  func onRateChanged(player: AVPlayer, oldRate: Float?, newRate: Float) {}
  func onVolumeChanged(player: AVPlayer, oldVolume: Float?, newVolume: Float) {}
  func onPlayedToEnd(player: AVPlayer) {}
  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?) {}
  func onIsMutedChanged(player: AVPlayer, oldIsMuted: Bool?, newIsMuted: Bool) {}
  func onPlayerItemStatusChanged(player: AVPlayer, oldStatus: AVPlayerItem.Status?, newStatus: AVPlayerItem.Status) {}
  func onTimeUpdate(player: AVPlayer, timeUpdate: TimeUpdate) {}
  func onAudioMixingModeChanged(player: AVPlayer, oldAudioMixingMode: AudioMixingMode, newAudioMixingMode: AudioMixingMode) {}
  func onSubtitleSelectionChanged(player: AVPlayer, playerItem: AVPlayerItem?, subtitleTrack: SubtitleTrack?) {}
  func onAudioTrackSelectionChanged(player: AVPlayer, playerItem: AVPlayerItem?, audioTrack: AudioTrack?) {}
  func onLoadedPlayerItem(player: AVPlayer, playerItem: AVPlayerItem?) {}
  func onVideoTrackChanged(player: AVPlayer, oldVideoTrack: VideoTrack?, newVideoTrack: VideoTrack?) {}
  func onIsExternalPlaybackActiveChanged(player: AVPlayer, oldIsExternalPlaybackActive: Bool?, newIsExternalPlaybackActive: Bool) {}
}

// Wrapper used to store WeakReferences to the observer delegate
final class WeakPlayerObserverDelegate: Hashable {
  private(set) weak var value: VideoPlayerObserverDelegate?

  init(value: VideoPlayerObserverDelegate? = nil) {
    self.value = value
  }

  static func == (lhs: WeakPlayerObserverDelegate, rhs: WeakPlayerObserverDelegate) -> Bool {
    guard let lhsValue = lhs.value, let rhsValue = rhs.value else {
      return lhs.value == nil && rhs.value == nil
    }
    return ObjectIdentifier(lhsValue) == ObjectIdentifier(rhsValue)
  }

  func hash(into hasher: inout Hasher) {
    if let value {
      hasher.combine(ObjectIdentifier(value))
    }
  }
}

class VideoPlayerObserver: VideoSourceLoaderListener {
  private weak var owner: VideoPlayer?
  private weak var videoSourceLoader: VideoSourceLoader?
  private let taskManager = ObserverTaskManager()

  var player: AVPlayer? {
    owner?.ref
  }
  var delegates = Set<WeakPlayerObserverDelegate>()
  private var currentItem: VideoPlayerItem?
  private var isLoadingAsynchronously = false
  private var loadedCurrentItem = false
  private var periodicTimeObserver: Any?
  private var currentVideoTrack: VideoTrack? {
    didSet {
      if let player, oldValue != currentVideoTrack {
        delegates.forEach { delegate in
          delegate.value?.onVideoTrackChanged(player: player, oldVideoTrack: oldValue, newVideoTrack: currentVideoTrack)
        }
      }
    }
  }

  private var isPlaying: Bool = false {
    didSet {
      if let player, oldValue != isPlaying {
        delegates.forEach { delegate in
          delegate.value?.onIsPlayingChanged(player: player, oldIsPlaying: oldValue, newIsPlaying: isPlaying)
        }
      }
    }
  }
  private var error: Exception?
  private var _status: PlayerStatus = .idle
  private var status: PlayerStatus {
    get {
      return _status
    }
    set {
      if newValue != .loading && isLoadingAsynchronously {
        return
      }

      if let player, newValue != status {
        let oldStatus = self._status
        _status = newValue
        delegates.forEach { delegate in
          delegate.value?.onStatusChanged(player: player, oldStatus: oldStatus, newStatus: status, error: error)
        }
      }
    }
  }

  private var isExternalPlaybackActive: Bool = false {
    didSet {
      guard let player else {
        return
      }
      delegates.forEach { delegate in
        delegate.value?.onIsExternalPlaybackActiveChanged(
          player: player,
          oldIsExternalPlaybackActive: oldValue,
          newIsExternalPlaybackActive: isExternalPlaybackActive
        )
      }
    }
  }

  private var playerItemObserver: NSObjectProtocol?
  private var playerRateObserver: NSKeyValueObservation?

  // Player observers
  private var playerStatusObserver: NSKeyValueObservation?
  private var playerTimeControlStatusObserver: NSKeyValueObservation?
  private var playerVolumeObserver: NSKeyValueObservation?
  private var playerCurrentItemObserver: NSKeyValueObservation?
  private var playerIsMutedObserver: NSKeyValueObservation?
  private var playerAudioMixingModeObserver: NSKeyValueObservation?
  private var tracksObserver: NSKeyValueObservation?
  private var playerExternalPlaybackObserver: NSKeyValueObservation?

  // Current player item observers
  private var playbackBufferEmptyObserver: NSKeyValueObservation?
  private var playerItemStatusObserver: NSKeyValueObservation?
  private var playbackLikelyToKeepUpObserver: NSKeyValueObservation?
  private var currentSubtitlesObserver: NSObjectProtocol?
  private var currentAudioTracksObserver: NSObjectProtocol?

  init(owner: VideoPlayer, videoSourceLoader: VideoSourceLoader) {
    self.owner = owner
    self.videoSourceLoader = videoSourceLoader
    initializePlayerObservers()
    self.videoSourceLoader?.registerListener(listener: self)
  }

  deinit {
    cleanup()
  }

  func registerDelegate(delegate: VideoPlayerObserverDelegate) {
    let weakDelegate = WeakPlayerObserverDelegate(value: delegate)
    delegates.insert(weakDelegate)
  }

  func unregisterDelegate(delegate: VideoPlayerObserverDelegate) {
    delegates.remove(WeakPlayerObserverDelegate(value: delegate))
  }

  func cleanup() {
    self.videoSourceLoader?.unregisterListener(listener: self)
    delegates.removeAll()
    invalidatePlayerObservers()
    invalidateCurrentPlayerItemObservers()
    stopTimeUpdates()
  }

  private func initializePlayerObservers() {
    guard let player else {
      return
    }
    playerRateObserver = player.observe(\.rate, options: [.initial, .new, .old]) { [weak self] player, change in
      self?.onPlayerRateChanged(player, change)
    }
    playerStatusObserver = player.observe(\.status, options: [.initial, .new, .old]) { [weak self] player, change in
      self?.onPlayerStatusChanged(player, change)
    }
    playerTimeControlStatusObserver = player.observe(\.timeControlStatus, options: [.new, .old]) { [weak self] player, change in
      self?.onTimeControlStatusChanged(player, change)
    }
    playerVolumeObserver = player.observe(\.volume, options: [.initial, .new, .old]) { [weak self] player, change in
      self?.onPlayerVolumeChanged(player, change)
    }
    playerIsMutedObserver = player.observe(\.isMuted, options: [.initial, .new, .old]) { [weak self] player, change in
      self?.onPlayerIsMutedChanged(player, change)
    }
    playerCurrentItemObserver = player.observe(\.currentItem, options: [.initial, .new]) { [weak self] player, change in
      self?.onPlayerCurrentItemChanged(player, change)
    }
    playerExternalPlaybackObserver = player.observe(\.isExternalPlaybackActive, changeHandler: { [weak self] player, change in
      self?.onIsExternalPlaybackActiveChanged(player, change)
    })
  }

  private func invalidatePlayerObservers() {
    playerRateObserver?.invalidate()
    playerStatusObserver?.invalidate()
    playerTimeControlStatusObserver?.invalidate()
    playerVolumeObserver?.invalidate()
    playerIsMutedObserver?.invalidate()
    playerCurrentItemObserver?.invalidate()
    playerExternalPlaybackObserver?.invalidate()
  }

  private func initializeCurrentPlayerItemObservers(player: AVPlayer, playerItem: AVPlayerItem) {
    playbackBufferEmptyObserver = playerItem.observe(\.isPlaybackBufferEmpty) { [weak self] item, change in
      self?.onIsBufferEmptyChanged(item, change)
    }

    playbackLikelyToKeepUpObserver = playerItem.observe(\.isPlaybackLikelyToKeepUp) { [weak self] item, change in
      self?.onPlayerLikelyToKeepUpChanged(item, change)
    }

    playerItemStatusObserver = playerItem.observe(\.status, options: [.initial, .new]) { [weak self] item, change in
      self?.onItemStatusChanged(item, change)
    }

    tracksObserver = playerItem.observe(\.tracks) { [weak self] item, _ in
      // For HLS sources AVPlayer doesn't provide the tracks when they change
      // But it does call this event when they are loaded and when the current track changes.
      // We have to extract the necessary information ourselves.
      self?.runTask(forKey: .trackChange) { [weak self, item] in
        // For HLS sources
        if let videoPlayerItem = playerItem as? VideoPlayerItem, videoPlayerItem.isHls {
          guard let itemUri = videoPlayerItem.videoSource.uri else {
            return
          }
          let lastLog = item.accessLog()?.events.last(where: { $0.uri != nil })
          let tracks = await videoPlayerItem.videoTracks

          guard let self, !Task.isCancelled else {
            return
          }

          self.currentVideoTrack = lastLog?.matchToVideoTrack(videoTracks: tracks, itemUrl: itemUri)
          return
        }

        // For non-HLS sources
        // The track which is currently playing will be first
        let currentTrack = try? await item.asset.loadTracks(withMediaType: .video).first

        if let currentTrack, !Task.isCancelled {
          let newVideoTrack = await VideoTrack.from(assetTrack: currentTrack)

          guard let self, !Task.isCancelled else {
            return
          }

          self.currentVideoTrack = newVideoTrack
        }
      }
    }

    playerItemObserver = NotificationCenter.default.addObserver(
      forName: NSNotification.Name.AVPlayerItemDidPlayToEndTime,
      object: playerItem,
      queue: nil
    ) { [weak self] _ in
      self?.delegates.forEach { delegate in
        delegate.value?.onPlayedToEnd(player: player)
      }
    }

    currentSubtitlesObserver = NotificationCenter.default.addObserver(
      forName: AVPlayerItem.mediaSelectionDidChangeNotification,
      object: playerItem,
      queue: nil
    ) { [weak self] _ in
      self?.runTask(forKey: .subtitleTrackLoad) { [weak self] in
        let subtitleTrack = await VideoPlayerSubtitles.findCurrentSubtitleTrack(for: playerItem)

        guard !Task.isCancelled else {
          return
        }

        self?.delegates.forEach { delegate in
          delegate.value?.onSubtitleSelectionChanged(player: player, playerItem: playerItem, subtitleTrack: subtitleTrack)
        }
      }
    }

    currentAudioTracksObserver = NotificationCenter.default.addObserver(
      forName: AVPlayerItem.mediaSelectionDidChangeNotification,
      object: playerItem,
      queue: nil
    ) { [weak self] _ in
      self?.runTask(forKey: .audioTrackLoad) { [weak self] in
        let audioTrack = await VideoPlayerAudioTracks.findCurrentAudioTrack(for: playerItem)

        guard !Task.isCancelled else {
          return
        }

        self?.delegates.forEach { delegate in
          delegate.value?.onAudioTrackSelectionChanged(player: player, playerItem: playerItem, audioTrack: audioTrack)
        }
      }
    }
  }

  private func invalidateCurrentPlayerItemObservers() {
    playbackLikelyToKeepUpObserver?.invalidate()
    playbackBufferEmptyObserver?.invalidate()
    playerItemStatusObserver?.invalidate()
    tracksObserver?.invalidate()

    Task { [taskManager] in
      await taskManager.cancelAll()
    }

    NotificationCenter.default.removeObserver(playerItemObserver as Any)
    NotificationCenter.default.removeObserver(currentSubtitlesObserver as Any)
    NotificationCenter.default.removeObserver(currentAudioTracksObserver as Any)
  }

  func startOrUpdateTimeUpdates(forInterval interval: Double) {
    let interval = CMTimeMake(value: Int64(interval * 1000), timescale: CMTimeScale(1000))

    stopTimeUpdates()
    self.periodicTimeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] _ in
      guard let self, let player, let owner else {
        return
      }
      let update = TimeUpdate(
        currentTime: player.currentTime().seconds,
        currentLiveTimestamp: owner.currentLiveTimestamp,
        currentOffsetFromLive: owner.currentOffsetFromLive,
        bufferedPosition: owner.bufferedPosition
      )

      delegates.forEach { delegate in
        delegate.value?.onTimeUpdate(player: player, timeUpdate: update)
      }
    }
  }

  func stopTimeUpdates() {
    if let periodicTimeObserver {
      player?.removeTimeObserver(periodicTimeObserver)
      self.periodicTimeObserver = nil
    }
  }

  // MARK: - VideoPlayerObserverDelegate

  private func onPlayerCurrentItemChanged(_ player: AVPlayer, _ change: NSKeyValueObservedChange<AVPlayerItem?>) {
    // Unwraps Optional<Optional<AVPlayerItem>> into Optional<AVPlayerItem>
    let newPlayerItem = change.newValue?.flatMap({ $0 })

    invalidateCurrentPlayerItemObservers()
    currentVideoTrack = nil

    if let videoPlayerItem = newPlayerItem as? VideoPlayerItem {
      initializeCurrentPlayerItemObservers(player: player, playerItem: videoPlayerItem)
      currentItem = videoPlayerItem

      delegates.forEach { delegate in
        delegate.value?.onItemChanged(player: player, oldVideoPlayerItem: currentItem, newVideoPlayerItem: videoPlayerItem)
      }
      loadedCurrentItem = false
      return
    }

    if newPlayerItem == nil {
      delegates.forEach { delegate in
        delegate.value?.onItemChanged(player: player, oldVideoPlayerItem: currentItem, newVideoPlayerItem: nil)
      }
      status = .idle
    } else {
      log.warn(
        "VideoPlayer's AVPlayer has been initialized with a `AVPlayerItem` instead of a `VideoPlayerItem`. " +
        "Always use `VideoPlayerItem` as a wrapper for media played in `VideoPlayer`."
      )
    }
    currentItem = nil
    // Nil player item will be loaded instantly
    onLoadedPlayerItem(player: player, playerItem: nil)
  }

  private func onLoadedPlayerItem(player: AVPlayer, playerItem: AVPlayerItem?) {
    loadedCurrentItem = true
    delegates.forEach { delegate in
      delegate.value?.onLoadedPlayerItem(player: player, playerItem: playerItem)
    }

    // Changing the player item will disable the subtitles
    delegates.forEach { delegate in
      delegate.value?.onSubtitleSelectionChanged(player: player, playerItem: playerItem, subtitleTrack: nil)
    }
  }

  private func onItemStatusChanged(_ playerItem: AVPlayerItem, _ change: NSKeyValueObservedChange<AVPlayerItem.Status>) {
    if player?.status != .failed {
      error = nil
    }
    if owner?.videoSourceLoader.isLoading == true {
      status = .loading
      return
    }

    let newStatus = playerItem.status.toVideoPlayerStatus(isPlaybackBufferEmpty: playerItem.isPlaybackBufferEmpty)

    // The AVPlayerItem.error can't be modified, so we have a custom field for caching errors
    if newStatus == .error {
      let playerItemError = (playerItem as? VideoPlayerItem)?.urlAsset.cachingError ?? playerItem.error ?? error
      error = PlayerItemLoadException(playerItemError?.localizedDescription)
      status = .error
    }

    if let player, !loadedCurrentItem && (newStatus == .readyToPlay || newStatus == .error) {
      onLoadedPlayerItem(player: player, playerItem: playerItem)
    }

    delegates.forEach { delegate in
      if let player {
        delegate.value?.onPlayerItemStatusChanged(player: player, oldStatus: change.oldValue, newStatus: playerItem.status)
      }
    }
  }

  private func onPlayerStatusChanged(_ player: AVPlayer, _ change: NSKeyValueObservedChange<AVPlayer.Status>) {
    if player.currentItem?.status != .failed {
      error = nil
    }

    if player.status == .failed {
      error = PlayerException(player.error?.localizedDescription)
      status = .error
    }
  }

  private func onTimeControlStatusChanged(_ player: AVPlayer, _ change: NSKeyValueObservedChange<AVPlayer.TimeControlStatus>) {
    // iOS changes timeControlStatus after an error, so we need to check for errors.
    if player.status == .failed || player.currentItem?.status == .failed {
      isPlaying = false
      return
    }
    error = nil

    if player.timeControlStatus != .waitingToPlayAtSpecifiedRate && player.status == .readyToPlay && currentItem?.isPlaybackBufferEmpty != true {
      status = .readyToPlay
    } else if player.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      switch player.reasonForWaitingToPlay {
      case .noItemToPlay:
        status = .idle
      case .evaluatingBufferingRate:
        // Every time the player is unpaused timeControlStatus goes into .waitingToPlayAtSpecifiedRate while evaluating buffering rate.
        // This takes less than a frame and we can ignore this change to avoid unnecessary status changes.
        break
      default:
        status = .loading
      }
    }

    if isPlaying != (player.timeControlStatus == .playing) {
      isPlaying = player.timeControlStatus == .playing
    }
  }

  private func onIsBufferEmptyChanged(_ playerItem: AVPlayerItem, _ change: NSKeyValueObservedChange<Bool>) {
    if playerItem.isPlaybackBufferEmpty {
      status = .loading
    }
  }

  private func onPlayerLikelyToKeepUpChanged(_ playerItem: AVPlayerItem, _ change: NSKeyValueObservedChange<Bool>) {
    if !playerItem.isPlaybackLikelyToKeepUp && playerItem.isPlaybackBufferEmpty {
      status = .loading
    } else if playerItem.isPlaybackLikelyToKeepUp {
      status = .readyToPlay
    }
  }

  private func onPlayerRateChanged(_ player: AVPlayer, _ change: NSKeyValueObservedChange<Float>) {
    if let newRate = change.newValue, change.oldValue != change.newValue {
      delegates.forEach { delegate in
        delegate.value?.onRateChanged(player: player, oldRate: change.oldValue, newRate: newRate)
      }
    }
  }

  private func onPlayerVolumeChanged(_ player: AVPlayer, _ change: NSKeyValueObservedChange<Float>) {
    if let newVolume = change.newValue, change.oldValue != change.newValue {
      delegates.forEach { delegate in
        delegate.value?.onVolumeChanged(player: player, oldVolume: change.oldValue, newVolume: newVolume)
      }
    }
  }

  private func onPlayerIsMutedChanged(_ player: AVPlayer, _ change: NSKeyValueObservedChange<Bool>) {
    if let newIsMuted = change.newValue, change.oldValue != change.newValue {
      delegates.forEach { delegate in
        delegate.value?.onIsMutedChanged(player: player, oldIsMuted: change.oldValue, newIsMuted: newIsMuted)
      }
    }
  }

  private func onIsExternalPlaybackActiveChanged(_ player: AVPlayer, _ change: NSKeyValueObservedChange<Bool>) {
    self.isExternalPlaybackActive = player.isExternalPlaybackActive
  }

  private func runTask(
    forKey key: ObserverTaskKey,
    operation: @escaping @Sendable () async -> Void
  ) {
    // Delegate the entire operation to the actor.
    // This requires making the call from an asynchronous context.
    Task { [weak self] in
      await self?.taskManager.run(forKey: key, operation: operation)
    }
  }

  // MARK: - VideoSourceLoaderListener
  func onLoadingStarted(loader: VideoSourceLoader, videoSource: VideoSource?) {
    isLoadingAsynchronously = true
    status = .loading
  }

  func onLoadingCancelled(loader: VideoSourceLoader, videoSource: VideoSource?) {
    isLoadingAsynchronously = false
    status = .idle
  }

  func onLoadingFinished(loader: VideoSourceLoader, videoSource: VideoSource?, result: VideoPlayerItem?) {
    isLoadingAsynchronously = false
  }
}

private extension AVPlayerItemAccessLogEvent {
  // Matches the LogEvent to an existing VideoTrack based on the uri, or returns null if doesn't exist
  func matchToVideoTrack(videoTracks: [VideoTrack], itemUrl: URL) -> VideoTrack? {
    // The logUri should contain the track id from `VideoTrack`, it's used for playing selected track
    guard let logUri = self.uri else {
      return nil
    }

    // We need to find a base uri to which the track id is added for streaming a specific source
    var components = URLComponents(url: itemUrl, resolvingAgainstBaseURL: false)
    components?.query = nil

    guard let baseUriString = components?.url?.deletingLastPathComponent().absoluteString else {
      return nil
    }

    // Removing the base uri from the log uri allows us to get the id, which can be matched to an existing VideoTrack
    let id = logUri.replacingOccurrences(of: baseUriString, with: "")

    return videoTracks.first { $0.id == id }
  }
}

fileprivate extension AVPlayerItem.Status {
  func toVideoPlayerStatus(isPlaybackBufferEmpty: Bool) -> PlayerStatus {
    switch self {
    case .unknown:
      return .loading
    case .failed:
      return .error
    case .readyToPlay:
      if isPlaybackBufferEmpty {
        return .loading
      }
      return .readyToPlay
    @unknown default:
      log.error("Unhandled `AVPlayerItem.Status` value: \(self), returning `.loading` as fallback. Add the missing case as soon as possible.")
      return .loading
    }
  }
}
