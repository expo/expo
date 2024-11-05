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

class VideoPlayerObserver {
  private weak var owner: VideoPlayer?
  var player: AVPlayer? {
    owner?.pointer
  }
  var delegates = Set<WeakPlayerObserverDelegate>()
  private var currentItem: VideoPlayerItem?
  private var periodicTimeObserver: Any?

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
  private var status: PlayerStatus = .idle {
    didSet {
      if let player, oldValue != status {
        delegates.forEach { delegate in
          delegate.value?.onStatusChanged(player: player, oldStatus: oldValue, newStatus: status, error: error)
        }
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

  // Current player item observers
  private var playbackBufferEmptyObserver: NSKeyValueObservation?
  private var playerItemStatusObserver: NSKeyValueObservation?
  private var playbackLikelyToKeepUpObserver: NSKeyValueObservation?

  init(owner: VideoPlayer) {
    self.owner = owner
    initializePlayerObservers()
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
    delegates.removeAll()
    invalidatePlayerObservers()
    invalidateCurrentPlayerItemObservers()
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
  }

  private func invalidatePlayerObservers() {
    playerRateObserver?.invalidate()
    playerStatusObserver?.invalidate()
    playerTimeControlStatusObserver?.invalidate()
    playerVolumeObserver?.invalidate()
    playerIsMutedObserver?.invalidate()
    playerCurrentItemObserver?.invalidate()
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

    playerItemObserver = NotificationCenter.default.addObserver(
      forName: NSNotification.Name.AVPlayerItemDidPlayToEndTime,
      object: playerItem,
      queue: nil
    ) { [weak self] _ in
      self?.delegates.forEach { delegate in
        delegate.value?.onPlayedToEnd(player: player)
      }
    }
  }

  private func invalidateCurrentPlayerItemObservers() {
    playbackLikelyToKeepUpObserver?.invalidate()
    playbackBufferEmptyObserver?.invalidate()
    playerItemStatusObserver?.invalidate()
    NotificationCenter.default.removeObserver(playerItemObserver as Any)
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

    if let videoPlayerItem = newPlayerItem as? VideoPlayerItem {
      initializeCurrentPlayerItemObservers(player: player, playerItem: videoPlayerItem)
      currentItem = videoPlayerItem

      delegates.forEach { delegate in
        delegate.value?.onItemChanged(player: player, oldVideoPlayerItem: currentItem, newVideoPlayerItem: videoPlayerItem)
      }
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
  }

  private func onItemStatusChanged(_ playerItem: AVPlayerItem, _ change: NSKeyValueObservedChange<AVPlayerItem.Status>) {
    if player?.status != .failed {
      error = nil
    }

    switch playerItem.status {
    case .unknown:
      status = .loading
    case .failed:
      error = PlayerItemLoadException(playerItem.error?.localizedDescription)
      status = .error
    case .readyToPlay:
      if playerItem.isPlaybackBufferEmpty {
        status = .loading
      } else {
        status = .readyToPlay
      }
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
      status = .loading
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
}
