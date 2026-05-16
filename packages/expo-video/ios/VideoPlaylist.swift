// Copyright 2026-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoModulesCore

private enum VideoPlaylistConstants {
  static let playlistStatusUpdate = "playlistStatusUpdate"
}

internal enum VideoPlaylistLoopMode: String, Enumerable {
  case none
  case single
  case all
}

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct VideoPlaylistSource: Record {
  @Field
  var id: String? = nil

  @Field
  var source: VideoSource? = nil

  @Field
  var metadata: VideoMetadata? = nil
}

internal struct VideoPlaylistReplaceOptions: Record {
  @Field
  var preserveCurrentSource: Bool = false
}
// swiftlint:enable redundant_optional_initialization

internal final class VideoPlaylist: SharedObject, VideoPlayerObserverDelegate {
  let id = UUID().uuidString
  let player: VideoPlayer

  private let interval: Double
  private let preloadLoader = VideoSourceLoader()
  private var sources: [VideoPlaylistSource]
  private var currentIndex: Int
  private var loopMode: VideoPlaylistLoopMode
  private var shouldPreloadNext: Bool
  private var autoAdvance: Bool
  private var shouldPlayWhenReady = false
  private var transitionGeneration = 0
  private var transitionTask: Task<Void, Never>?
  private var preloadTask: Task<Void, Never>?
  private var preloadedItem: VideoPlayerItem?
  private var preloadedIndex: Int?
  private var preloadedIdentity: String?
  private var timeToken: Any?
  private var error: PlaybackError?
  private var isDestroyed = false

  init(
    sources: [VideoPlaylistSource],
    initialIndex: Int,
    interval: Double,
    loopMode: VideoPlaylistLoopMode,
    preloadNext: Bool,
    autoAdvance: Bool
  ) throws {
    self.sources = sources
    self.currentIndex = sources.isEmpty ? 0 : min(max(initialIndex, 0), sources.count - 1)
    self.interval = max(interval, 1)
    self.loopMode = loopMode
    self.shouldPreloadNext = preloadNext
    self.autoAdvance = autoAdvance
    self.player = try VideoPlayer(AVPlayer(), initialSource: nil)

    super.init()

    player.observer?.registerDelegate(delegate: self)
    registerTimeObserver()

    if !sources.isEmpty {
      transition(to: currentIndex, shouldPlay: false)
    } else {
      emitStatus()
    }
  }

  deinit {
    cleanup()
  }

  var sourceCount: Int {
    sources.count
  }

  var currentStatus: [String: Any] {
    statusPayload()
  }

  func play() {
    shouldPlayWhenReady = true
    player.ref.play()
    emitStatus()
  }

  func pause() {
    shouldPlayWhenReady = false
    player.ref.pause()
    emitStatus()
  }

  func next() {
    guard let nextIndex = nextIndex() else {
      return
    }
    transition(to: nextIndex, shouldPlay: shouldPlayWhenReady || player.isPlaying)
  }

  func previous() {
    guard let previousIndex = previousIndex() else {
      return
    }
    transition(to: previousIndex, shouldPlay: shouldPlayWhenReady || player.isPlaying)
  }

  func skipTo(index: Int) {
    guard validIndex(index) else {
      return
    }
    transition(to: index, shouldPlay: shouldPlayWhenReady || player.isPlaying)
  }

  func seekTo(seconds: Double) async {
    let clampedSeconds = max(seconds, 0)
    let time = CMTime(seconds: clampedSeconds, preferredTimescale: CMTimeScale(NSEC_PER_SEC))

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      player.ref.seek(to: time) { [weak self] _ in
        self?.emitStatus()
        continuation.resume()
      }
    }
  }

  func add(source: VideoPlaylistSource) {
    sources.append(source)
    if sources.count == 1 {
      currentIndex = 0
      transition(to: 0, shouldPlay: shouldPlayWhenReady || player.isPlaying)
    } else {
      preloadNextItem()
      emitStatus()
    }
  }

  func insert(source: VideoPlaylistSource, at index: Int) {
    guard index >= 0 && index <= sources.count else {
      return
    }

    let wasEmpty = sources.isEmpty
    sources.insert(source, at: index)

    if wasEmpty {
      currentIndex = 0
      transition(to: 0, shouldPlay: shouldPlayWhenReady || player.isPlaying)
      return
    }

    if index <= currentIndex {
      currentIndex += 1
    }

    preloadNextItem()
    emitStatus()
  }

  func remove(at index: Int) {
    guard validIndex(index) else {
      return
    }

    let wasCurrentSource = index == currentIndex
    let shouldResume = shouldPlayWhenReady || player.isPlaying
    sources.remove(at: index)

    guard !sources.isEmpty else {
      clear()
      return
    }

    if wasCurrentSource {
      if currentIndex >= sources.count {
        currentIndex = sources.count - 1
      }
      transition(to: currentIndex, shouldPlay: shouldResume)
      return
    }

    if index < currentIndex {
      currentIndex -= 1
    }

    preloadNextItem()
    emitStatus()
  }

  func clear() {
    transitionGeneration += 1
    transitionTask?.cancel()
    preloadTask?.cancel()
    preloadLoader.cancelCurrentTask()
    preloadedItem = nil
    preloadedIndex = nil
    preloadedIdentity = nil
    shouldPlayWhenReady = false
    sources.removeAll()
    currentIndex = 0
    error = nil
    player.ref.pause()
    player.replaceCurrentItem(withPreloadedItem: nil)
    DispatchQueue.main.async { [weak self] in
      self?.emitStatus()
    }
  }

  func replaceAll(sources newSources: [VideoPlaylistSource], options: VideoPlaylistReplaceOptions?) {
    let sourceToPreserve = currentSource()
    let shouldResume = shouldPlayWhenReady || player.isPlaying
    let preserveCurrentSource = options?.preserveCurrentSource ?? false
    let newIndex = preserveCurrentSource ? indexPreservingCurrentSource(in: newSources, currentSource: sourceToPreserve) : 0

    sources = newSources
    currentIndex = newSources.isEmpty ? 0 : newIndex
    preloadedItem = nil
    preloadedIndex = nil
    preloadedIdentity = nil
    preloadTask?.cancel()
    preloadLoader.cancelCurrentTask()

    guard !newSources.isEmpty else {
      clear()
      return
    }

    transition(to: currentIndex, shouldPlay: shouldResume)
  }

  func destroy() {
    cleanup()
  }

  override func sharedObjectWillRelease() {
    cleanup()
  }

  // MARK: - VideoPlayerObserverDelegate

  func onStatusChanged(player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?) {
    if let error {
      self.error = PlaybackError(message: error.description)
    } else if newStatus != .error {
      self.error = nil
    }
    emitStatus()
  }

  func onIsPlayingChanged(player: AVPlayer, oldIsPlaying: Bool?, newIsPlaying: Bool) {
    emitStatus()
  }

  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?) {
    emitStatus()
  }

  func onLoadedPlayerItem(player: AVPlayer, playerItem: AVPlayerItem?) {
    emitStatus()
  }

  func onPlayedToEnd(player: AVPlayer) {
    handlePlayToEnd()
  }

  // MARK: - Transitions

  private func transition(to index: Int, shouldPlay: Bool) {
    guard validIndex(index), !isDestroyed else {
      return
    }

    transitionGeneration += 1
    let generation = transitionGeneration
    currentIndex = index
    shouldPlayWhenReady = shouldPlay
    emitStatus()

    transitionTask?.cancel()
    transitionTask = Task { [weak self] in
      guard let self else {
        return
      }
      await self.transition(to: index, shouldPlay: shouldPlay, generation: generation)
    }
  }

  private func transition(to index: Int, shouldPlay: Bool, generation: Int) async {
    guard validIndex(index), !Task.isCancelled else {
      return
    }

    let playlistSource = sources[index]
    let sourceIdentity = sourceIdentity(playlistSource)
    let playerItem: VideoPlayerItem?

    if let preloadedItem,
      preloadedIndex == index,
      preloadedIdentity == sourceIdentity {
      playerItem = preloadedItem
      self.preloadedItem = nil
      self.preloadedIndex = nil
      self.preloadedIdentity = nil
    } else if let source = playlistSource.source {
      do {
        playerItem = try await player.loadPlayerItem(with: source, using: player.videoSourceLoader)
      } catch {
        guard generation == transitionGeneration else {
          return
        }
        self.error = PlaybackError(message: error.localizedDescription)
        emitStatus()
        preloadNextItem()
        return
      }
    } else {
      playerItem = nil
    }

    guard generation == transitionGeneration, !Task.isCancelled, !isDestroyed else {
      return
    }

    player.replaceCurrentItem(withPreloadedItem: playerItem)

    if shouldPlay {
      DispatchQueue.main.async { [weak self] in
        self?.player.ref.play()
      }
    }

    emitStatus()
    preloadNextItem()
  }

  private func handlePlayToEnd() {
    guard !sources.isEmpty else {
      emitStatus(with: ["didJustFinish": true, "playing": false])
      return
    }

    guard autoAdvance else {
      shouldPlayWhenReady = false
      player.ref.pause()
      emitStatus(with: ["didJustFinish": true, "playing": false])
      return
    }

    switch loopMode {
    case .single:
      shouldPlayWhenReady = true
      player.seeker.seek(to: .zero)
      player.ref.play()
      emitStatus(with: ["didJustFinish": true])
    case .all:
      if currentIndex >= sources.count - 1 {
        transition(to: 0, shouldPlay: true)
      } else {
        transition(to: currentIndex + 1, shouldPlay: true)
      }
    case .none:
      if currentIndex >= sources.count - 1 {
        shouldPlayWhenReady = false
        player.ref.pause()
        emitStatus(with: ["didJustFinish": true, "playing": false])
      } else {
        transition(to: currentIndex + 1, shouldPlay: true)
      }
    }
  }

  // MARK: - Preloading

  private func preloadNextItem() {
    preloadTask?.cancel()
    preloadLoader.cancelCurrentTask()
    preloadedItem = nil
    preloadedIndex = nil
    preloadedIdentity = nil

    guard shouldPreloadNext,
      !isDestroyed,
      sources.count > 1,
      loopMode != .single,
      let index = nextIndex(),
      let source = sources[index].source else {
      return
    }

    let generation = transitionGeneration
    let identity = sourceIdentity(sources[index])
    preloadTask = Task { [weak self] in
      guard let self else {
        return
      }

      do {
        guard let item = try await self.player.loadPlayerItem(with: source, using: self.preloadLoader) else {
          return
        }
        guard !Task.isCancelled,
          generation == self.transitionGeneration,
          self.validIndex(index),
          self.sourceIdentity(self.sources[index]) == identity else {
          return
        }

        self.preloadedItem = item
        self.preloadedIndex = index
        self.preloadedIdentity = identity
      } catch {
        // Preloading is opportunistic. The main transition path will surface load errors.
      }
    }
  }

  // MARK: - Status

  private func statusPayload(extra: [String: Any] = [:]) -> [String: Any] {
    var payload: [String: Any] = [
      "id": id,
      "currentIndex": currentIndex,
      "sourceCount": sources.count,
      "currentSource": currentSourcePayload() ?? NSNull(),
      "currentTime": player.currentTime,
      "duration": playerDuration,
      "playing": player.isPlaying,
      "isBuffering": isBuffering,
      "isLoaded": isLoaded,
      "status": player.status.rawValue,
      "loop": loopMode.rawValue,
      "canPlayNext": nextIndex() != nil,
      "canPlayPrevious": previousIndex() != nil,
      "error": error?.toDictionary(appContext: appContext) ?? NSNull(),
      "didJustFinish": false
    ]
    payload.merge(extra) { _, new in new }
    return payload
  }

  private func emitStatus(with extra: [String: Any] = [:]) {
    emit(event: VideoPlaylistConstants.playlistStatusUpdate, payload: statusPayload(extra: extra))
  }

  private func currentSourcePayload() -> [String: Any]? {
    guard let source = currentSource() else {
      return nil
    }

    var payload: [String: Any] = [
      "source": source.source?.toDictionary(appContext: appContext) ?? NSNull()
    ]

    if let id = source.id {
      payload["id"] = id
    }

    if let metadata = source.metadata {
      payload["metadata"] = metadata.toDictionary(appContext: appContext)
    }

    return payload
  }

  private var playerDuration: Double {
    let duration = player.ref.currentItem?.duration.seconds ?? 0
    return duration.isNaN ? 0 : duration
  }

  private var isLoaded: Bool {
    player.ref.currentItem?.status == .readyToPlay
  }

  private var isBuffering: Bool {
    if player.isPlaying {
      return false
    }
    if player.ref.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      return true
    }
    if let currentItem = player.ref.currentItem {
      return !currentItem.isPlaybackLikelyToKeepUp && currentItem.isPlaybackBufferEmpty
    }
    return false
  }

  private func registerTimeObserver() {
    let updateInterval = interval / 1000
    let interval = CMTime(seconds: updateInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))

    timeToken = player.ref.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] _ in
      self?.emitStatus()
    }
  }

  // MARK: - Source helpers

  private func currentSource() -> VideoPlaylistSource? {
    guard validIndex(currentIndex) else {
      return nil
    }
    return sources[currentIndex]
  }

  private func nextIndex() -> Int? {
    guard !sources.isEmpty else {
      return nil
    }

    let nextIndex = currentIndex + 1
    if nextIndex < sources.count {
      return nextIndex
    }
    return loopMode == .all ? 0 : nil
  }

  private func previousIndex() -> Int? {
    guard !sources.isEmpty else {
      return nil
    }

    let previousIndex = currentIndex - 1
    if previousIndex >= 0 {
      return previousIndex
    }
    return loopMode == .all ? sources.count - 1 : nil
  }

  private func validIndex(_ index: Int) -> Bool {
    index >= 0 && index < sources.count
  }

  private func indexPreservingCurrentSource(in newSources: [VideoPlaylistSource], currentSource: VideoPlaylistSource?) -> Int {
    guard let currentSource, !newSources.isEmpty else {
      return 0
    }

    if let id = currentSource.id,
      let index = newSources.firstIndex(where: { $0.id == id }) {
      return index
    }

    let identity = sourceIdentity(currentSource)
    return newSources.firstIndex { sourceIdentity($0) == identity } ?? 0
  }

  private func sourceIdentity(_ playlistSource: VideoPlaylistSource) -> String {
    guard let source = playlistSource.source else {
      return "null"
    }

    var parts = [
      source.uri?.absoluteString ?? "",
      source.contentType.rawValue,
      source.useCaching ? "cache" : "no-cache"
    ]

    if let headers = source.headers {
      for key in headers.keys.sorted() {
        parts.append("header:\(key)=\(headers[key] ?? "")")
      }
    }

    if let drm = source.drm {
      parts.append("drm:\(drm.type.rawValue)")
      parts.append("license:\(drm.licenseServer ?? "")")
      parts.append("contentId:\(drm.contentId ?? "")")
      parts.append("certificate:\(drm.certificateUrl?.absoluteString ?? "")")
      parts.append("certificateData:\(drm.base64CertificateData ?? "")")
    }

    return parts.joined(separator: "|")
  }

  private func cleanup() {
    guard !isDestroyed else {
      return
    }

    isDestroyed = true
    transitionGeneration += 1
    transitionTask?.cancel()
    preloadTask?.cancel()
    preloadLoader.cancelCurrentTask()
    player.videoSourceLoader.cancelCurrentTask()
    player.observer?.unregisterDelegate(delegate: self)

    if let timeToken {
      player.ref.removeTimeObserver(timeToken)
      self.timeToken = nil
    }

    player.ref.pause()
    player.replaceCurrentItem(withPreloadedItem: nil)
  }
}
