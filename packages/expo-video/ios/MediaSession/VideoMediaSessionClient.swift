// Copyright 2026-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoMediaSession
import ExpoModulesCore

/**
 * Requests the audio session and the Now Playing controls for one player from `expo-media-session`.
 * `expo-video` must not write the audio session, the Now Playing info or the remote commands directly.
 * Only this class calls `MediaSessionManager`.
 */
final class VideoMediaSessionClient: MediaSessionObserver, VideoPlayerObserverDelegate, NowPlayingOwner {
  static let clientName = "expo-video"

  private struct Storage {
    var state = VideoSessionState()
    var use: SessionUse?
    var appliedRequirements: SessionRequirements?
    var reportedConflicts: [VideoSessionConflict] = []
    var claim: NowPlayingClaim?
    var assetMetadata: VideoAssetMetadata?
    var assetMetadataItem: ObjectIdentifier?
    var assetMetadataTask: Task<Void, Never>?
    var registration: ObserverRegistration?
    var timeJumpedObserver: NSObjectProtocol?
    var isInvalidated = false
  }

  private weak var player: VideoPlayer?
  // Code that holds the lock must read this player, not `player`. If such a read holds the last reference
  // to the `VideoPlayer`, its deinit calls `invalidate()` on the same thread and locks again.
  private weak var avPlayer: AVPlayer?
  // Calls to `MediaSessionManager` are made while this lock is held, so they stay in the order of the state changes.
  private let storage = Mutex(Storage())

  init(player: VideoPlayer) {
    self.player = player
    self.avPlayer = player.ref
    let registration = MediaSessionManager.shared.addObserver(self)
    // The observer is for all items, so it does not have to move to the new item on each change of the source.
    let timeJumpedObserver = NotificationCenter.default.addObserver(
      forName: AVPlayerItem.timeJumpedNotification,
      object: nil,
      queue: nil
    ) { [weak self] notification in
      self?.onTimeJumped(item: notification.object as? AVPlayerItem)
    }

    storage.withLock { storage in
      storage.state.isMuted = player.ref.isMuted
      storage.state.setHasItem(player.ref.currentItem != nil)
      storage.state.setPlaying(player.ref.rate != 0)
      storage.registration = registration
      storage.timeJumpedObserver = timeJumpedObserver
    }
  }

  func update(_ change: (inout VideoSessionState) -> Void) {
    let result = storage.withLock { storage -> (asksOtherPlayersNotToMix: Bool, warnings: [String])? in
      guard !storage.isInvalidated else {
        return nil
      }
      change(&storage.state)
      storage.state.anotherPlayerWantsNowPlaying = VideoManager.shared.anotherPlayerWantsNowPlaying(than: self)
      reconcile(&storage)
      return (storage.state.asksOtherPlayersNotToMix, newWarnings(&storage))
    }
    guard let result else {
      return
    }
    // The other players reconcile here, and each of them locks its own storage. Do not call this while `storage` is locked.
    VideoManager.shared.setWantsNowPlaying(result.asksOtherPlayersNotToMix, for: self)

    for warning in result.warnings {
      player?.appContext?.jsLogger.warn(warning)
    }
  }

  // Call this while `storage` is locked. A call after `invalidate()` would add the released player to `VideoManager` again.
  private func newWarnings(_ storage: inout Storage) -> [String] {
    let conflicts = sessionConflicts(
      state: storage.state,
      policyMode: MediaSessionManager.shared.policy.interruptionMode
    )
    var warnings = conflicts.filter { !storage.reportedConflicts.contains($0) }.map(\.message)
    storage.reportedConflicts = conflicts

    if VideoManager.shared.updateSessionManagement(storage.state, for: self) {
      warnings.append(sessionManagementMixWarning)
    }
    return warnings
  }

  func refresh() {
    update { _ in }
  }

  func invalidate() {
    let (registration, timeJumpedObserver) = storage.withLock { storage -> (ObserverRegistration?, NSObjectProtocol?) in
      storage.isInvalidated = true
      VideoManager.shared.removeSessionManagement(for: self)
      withdrawClaim(&storage)
      storage.use?.end()
      storage.use = nil
      storage.appliedRequirements = nil

      let observers = (storage.registration, storage.timeJumpedObserver)
      storage.registration = nil
      storage.timeJumpedObserver = nil
      return observers
    }
    VideoManager.shared.setWantsNowPlaying(false, for: self)
    registration?.remove()
    if let timeJumpedObserver {
      NotificationCenter.default.removeObserver(timeJumpedObserver)
    }
  }

  private func reconcile(_ storage: inout Storage) {
    if nowPlayingClaimAction(hasClaim: storage.claim != nil, state: storage.state) == .withdraw {
      withdrawClaim(&storage)
    }

    let useAction = sessionUseAction(
      isUseLive: storage.use != nil,
      applied: storage.appliedRequirements,
      state: storage.state
    )

    switch useAction {
    case .none:
      break
    case .begin(let requirements):
      storage.use = MediaSessionManager.shared.beginUse(client: Self.clientName, requirements: requirements)
      storage.appliedRequirements = requirements
    case .update(let requirements):
      storage.use?.update(requirements)
      storage.appliedRequirements = requirements
    case .end:
      storage.use?.end()
      storage.use = nil
      storage.appliedRequirements = nil
    }

    guard storage.state.wantsNowPlaying else {
      return
    }
    loadAssetMetadataIfNeeded(&storage)
    let info = nowPlayingInfo(assetMetadata: storage.assetMetadata)

    // The module learns that the owner started to play or paused only from an update of the claim.
    if let claim = storage.claim {
      claim.update(info)
    } else {
      storage.claim = MediaSessionManager.shared.offerNowPlaying(self, info: info, commands: VideoNowPlaying.commands)
    }
  }

  private func withdrawClaim(_ storage: inout Storage) {
    storage.claim?.withdraw()
    storage.claim = nil
    storage.assetMetadataTask?.cancel()
    storage.assetMetadataTask = nil
    storage.assetMetadata = nil
    storage.assetMetadataItem = nil
  }

  // MARK: - Now Playing info

  private func nowPlayingInfo(assetMetadata: VideoAssetMetadata?) -> NowPlayingInfo {
    guard let ref = avPlayer, let item = ref.currentItem else {
      return NowPlayingInfo()
    }

    return VideoNowPlaying.info(
      metadata: (item as? VideoPlayerItem)?.videoSource.metadata,
      asset: assetMetadata,
      // The duration of an item that is not ready is indefinite, which would show it as a live stream.
      duration: item.status == .readyToPlay ? item.duration : .invalid,
      elapsedTime: item.currentTime().seconds,
      // The rate stays set while the player buffers, but the position does not advance.
      rate: ref.timeControlStatus == .playing ? ref.rate : 0
    )
  }

  private func loadAssetMetadataIfNeeded(_ storage: inout Storage) {
    guard let item = avPlayer?.currentItem else {
      return
    }
    let itemID = ObjectIdentifier(item)

    if storage.assetMetadataItem == itemID {
      return
    }
    storage.assetMetadataTask?.cancel()
    storage.assetMetadata = nil
    storage.assetMetadataItem = itemID
    storage.assetMetadataTask = Task { [weak self] in
      let metadata = await Self.loadAssetMetadata(for: item)
      self?.setAssetMetadata(metadata, itemID: itemID)
    }
  }

  private func setAssetMetadata(_ metadata: VideoAssetMetadata?, itemID: ObjectIdentifier) {
    storage.withLock { storage in
      guard !storage.isInvalidated, storage.assetMetadataItem == itemID else {
        return
      }
      storage.assetMetadata = metadata
      reconcile(&storage)
    }
  }

  private static func loadAssetMetadata(for item: AVPlayerItem) async -> VideoAssetMetadata? {
    guard let metadata = try? await item.asset.loadMetadata(for: .iTunesMetadata) else {
      return nil
    }
    func first(_ key: AVMetadataKey) -> AVMetadataItem? {
      return metadata.first { $0.commonKey == key }
    }

    return VideoAssetMetadata(
      title: try? await first(.commonKeyTitle)?.load(.stringValue),
      artist: try? await first(.commonKeyArtist)?.load(.stringValue),
      artworkData: try? await first(.commonKeyArtwork)?.load(.dataValue)
    )
  }

  private func onTimeJumped(item: AVPlayerItem?) {
    guard let item, item === avPlayer?.currentItem else {
      return
    }
    refresh()
  }

  // MARK: - NowPlayingOwner

  var mediaType: NowPlayingMediaType {
    return .video
  }

  var isPlaying: Bool {
    return storage.withLock { $0.state.isPlaying }
  }

  private func onMain(_ action: @escaping (AVPlayer) -> Void) {
    DispatchQueue.main.async { [weak self] in
      guard let self, let ref = self.avPlayer, !self.storage.withLock({ $0.isInvalidated }) else {
        return
      }
      action(ref)
    }
  }

  func handle(_ command: RemoteCommand) {
    onMain { [self] ref in
      switch command.kind {
      case .play:
        if ref.rate == 0 {
          ref.play()
        }
      case .pause:
        // iOS shows the controls as playing while another player of the app plays, and then it sends
        // only pause commands. A pause command for a paused player is then the request to play.
        if ref.rate == 0 && VideoManager.shared.isAnotherPlayerPlaying(than: self) {
          ref.play()
        } else {
          ref.pause()
        }
      case .togglePlayPause:
        if ref.rate == 0 {
          ref.play()
        } else {
          ref.pause()
        }
      default:
        guard let target = VideoNowPlaying.seekTarget(for: command, currentTime: ref.currentTime().seconds) else {
          return
        }
        let time = CMTime(seconds: target, preferredTimescale: .max)

        if command.kind == .seek {
          ref.seek(to: time) { _ in
            ref.play()
          }
        } else {
          ref.seek(to: time)
        }
      }
    }
  }

  func pauseForTakeover() {
    update { $0.isPausedForTakeover = true }
    onMain { $0.pause() }
  }

  func resumeAfterTakeover() {
    let isPausedForTakeover = storage.withLock { $0.state.isPausedForTakeover }

    if isPausedForTakeover {
      onMain { $0.play() }
    }
  }

  // The module cannot see a pause of a player that it already paused for a takeover.
  // Without this, it resumes a player that the app paused itself.
  func onPauseRequested() {
    update { $0.isPausedForTakeover = false }
  }

  // MARK: - VideoPlayerObserverDelegate

  // The rate stays set while the player buffers. `isPlaying` does not, and a use that ends for a stall
  // lets other apps resume their audio after 1 second.
  func onRateChanged(player: AVPlayer, oldRate: Float?, newRate: Float) {
    update { $0.setPlaying(newRate != 0) }
  }

  func onIsPlayingChanged(player: AVPlayer, oldIsPlaying: Bool?, newIsPlaying: Bool) {
    refresh()
  }

  func onIsMutedChanged(player: AVPlayer, oldIsMuted: Bool?, newIsMuted: Bool) {
    update { $0.isMuted = newIsMuted }
  }

  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?) {
    update { $0.setHasItem(newVideoPlayerItem != nil) }
  }

  func onPlayerItemStatusChanged(player: AVPlayer, oldStatus: AVPlayerItem.Status?, newStatus: AVPlayerItem.Status) {
    if newStatus == .readyToPlay {
      refresh()
    }
  }

  // MARK: - MediaSessionObserver

  func mediaSession(didFail error: Error, client: String) {
    let hasLiveUse = storage.withLock { $0.use != nil }

    // Every observer gets the failures of all `expo-video` players.
    guard client == Self.clientName, hasLiveUse else {
      return
    }
    log.warn("[expo-video] Failed to activate the audio session. This might cause issues with audio playback and Picture in Picture. \(Self.failureDescription(error))")
  }

  // `localizedDescription` drops the text of an `Exception`, which says what failed and what to do.
  static func failureDescription(_ error: Error) -> String {
    return (error as? Exception)?.description ?? error.localizedDescription
  }

  func mediaSessionServicesReset() {
    // The system resets all audio and video objects. `expo-media-session` restores the audio session,
    // and the player has to rebuild its item, otherwise it stays in a failed state.
    DispatchQueue.main.async { [weak player] in
      player?.reloadCurrentSource()
    }
  }
}
