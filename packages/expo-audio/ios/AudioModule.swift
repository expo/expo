import ExpoMediaSession
import ExpoModulesCore

@ExpoModule("ExpoAudio")
public final class AudioModule: Module {
  private let registry = AudioComponentRegistry()
  var session: any MediaSessionManaging = MediaSessionManager.shared
  private var observerRegistration: (any ObserverRegistration)?
  private let audioEnabled = Mutex(true)
  private let mode = Mutex<AudioMode?>(nil)

  var lastConfiguredMode: AudioMode? {
    mode.withLock { $0 }
  }

  private var currentMode: AudioMode {
    lastConfiguredMode ?? AudioMode()
  }

  public override func didCreate() {
    #if os(iOS)
    appContext?.permissions?.register([
      AudioRecordingRequester()
    ])
    #endif

    observerRegistration = session.addObserver(ServicesResetObserver(module: self))
  }

  public override func willDestroy() {
    observerRegistration?.remove()
    registry.allPlayables.forEach { $0.endSessionUse() }
    registry.allPlayers.values.forEach { $0.releaseHold() }
    #if os(iOS)
    registry.allRecorders.values.forEach { $0.endSessionUse() }
    #endif
    registry.removeAllPreloadedPlayers()
    registry.removeAll()
  }

  @JS
  func setAudioModeAsync(_ partialMode: PartialAudioMode) async throws {
    let mode = partialMode.merged(into: currentMode)
    try AudioUtils.validateAudioMode(mode: mode)
    try session.setPolicy(
      AudioPolicyUpdate(
        playsInSilentMode: mode.playsInSilentMode,
        interruptionMode: mode.interruptionMode,
        allowsRecording: mode.allowsRecording,
        shouldRouteThroughEarpiece: mode.shouldRouteThroughEarpiece
      )
    )
    self.mode.withLock { $0 = mode }

    registry.allPlayers.values.forEach { $0.setContinuesInBackground(mode.shouldPlayInBackground) }
    registry.allPlaylists.values.forEach { $0.setContinuesInBackground(mode.shouldPlayInBackground) }
    #if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      if !mode.allowsRecording && recorder.isRecording {
        recorder.ref.stop()
      }
      recorder.allowsRecording = mode.allowsRecording
      recorder.setContinuesInBackground(mode.allowsBackgroundRecording)
    }
    #endif
  }

  @JS
  func setIsAudioActiveAsync(_ isActive: Bool) async throws {
    audioEnabled.withLock { $0 = isActive }
    guard !isActive else {
      return
    }
    registry.allPlayables.forEach { $0.pause() }
    registry.allPlayers.values.forEach { $0.releaseHold() }
  }

  @JS
  func requestRecordingPermissionsAsync() async throws -> [String: Any] {
    #if os(iOS)
    guard let permissions = appContext?.permissions else {
      throw Exceptions.PermissionsModuleNotFound()
    }
    return try await withPermissionsContinuation { resolve, reject in
      permissions.askForPermission(usingRequesterClass: AudioRecordingRequester.self, resolve: resolve, reject: reject)
    }
    #else
    throw Exception(name: "UnsupportedOperation", description: "Audio recording is not supported on this platform.")
    #endif
  }

  @JS
  func getRecordingPermissionsAsync() async throws -> [String: Any] {
    #if os(iOS)
    guard let permissions = appContext?.permissions else {
      throw Exceptions.PermissionsModuleNotFound()
    }
    return try await withPermissionsContinuation { resolve, reject in
      permissions.getPermissionUsingRequesterClass(AudioRecordingRequester.self, resolve: resolve, reject: reject)
    }
    #else
    throw Exception(name: "UnsupportedOperation", description: "Audio recording is not supported on this platform.")
    #endif
  }

  @JS
  func preload(_ source: AudioSource, _ preferredForwardBufferDuration: Double) async {
    guard let uri = source.uri else {
      return
    }
    let key = uri.absoluteString
    if registry.hasPreloadedPlayer(forKey: key) {
      return
    }
    let player = AudioUtils.createAVPlayer(from: source)
    player.currentItem?.preferredForwardBufferDuration = preferredForwardBufferDuration
    registry.addPreloadedPlayer(player, forKey: key)
  }

  @JS
  func clearPreloadedSource(_ source: AudioSource) async {
    guard let uri = source.uri else {
      return
    }
    _ = registry.removePreloadedPlayer(forKey: uri.absoluteString)
  }

  @JS
  func clearAllPreloadedSources() async {
    registry.removeAllPreloadedPlayers()
  }

  @JS
  func getPreloadedSources() async -> [String] {
    registry.preloadedPlayerKeys()
  }

  public func definition() -> ModuleDefinition {
    // swiftlint:disable:next closure_body_length
    Class(AudioPlayer.self) {
      Constructor { (source: AudioSource?, updateInterval: Double, keepAudioSessionActive: Bool, preferredForwardBufferDuration: Double, allowsExternalPlayback: Bool) -> AudioPlayer in
        let avPlayer: AVPlayer
        if let uri = source?.uri?.absoluteString, let cachedPlayer = self.registry.removePreloadedPlayer(forKey: uri) {
          avPlayer = cachedPlayer
        } else {
          avPlayer = AudioUtils.createAVPlayer(from: source)
        }
        avPlayer.allowsExternalPlayback = allowsExternalPlayback
        let player = AudioPlayer(avPlayer, interval: updateInterval, source: source, session: self.session)
        player.owningRegistry = self.registry
        player.keepAudioSessionActive = keepAudioSessionActive
        player.continuesInBackground = self.currentMode.shouldPlayInBackground
        player.canStartPlayback = { [weak self] in self?.canStartPlayback() ?? false }
        // Store the preference so it is re-applied whenever the item is replaced.
        player.preferredForwardBufferDuration = preferredForwardBufferDuration
        self.registry.add(player)
        return player
      }

      Function("play") { player in
        player.play()
      }

      Function("replace") { (player, source: AudioSource?) in
        if let uri = source?.uri?.absoluteString, let cachedPlayer = self.registry.removePreloadedPlayer(forKey: uri) {
          let cachedItem = cachedPlayer.currentItem
          cachedPlayer.replaceCurrentItem(with: nil)
          player.replaceWithPreloadedItem(cachedItem)
        } else {
          player.replaceCurrentSource(source: source)
        }
      }

      Function("pause") { player in
        player.pause()
      }

      Function("remove") { player in
        self.registry.remove(player)
        player.endSessionUse()
        player.releaseHold()
      }
    }

    Class(AudioPlaylist.self) {
      Constructor { (sources: [AudioSource], updateInterval: Double, loopMode: LoopMode) -> AudioPlaylist in
        // Keep one slot per source, nil where an item can't be created, so playerItems stays aligned with sources.
        let items = sources.map { AudioUtils.createAVPlayerItem(from: $0) }
        let avQueuePlayer = AVQueuePlayer(items: items.compactMap { $0 })
        let playlist = AudioPlaylist(
          avQueuePlayer,
          sources: sources,
          items: items,
          interval: updateInterval,
          loopMode: loopMode,
          session: self.session
        )
        playlist.owningRegistry = self.registry
        playlist.continuesInBackground = self.currentMode.shouldPlayInBackground
        playlist.canStartPlayback = { [weak self] in self?.canStartPlayback() ?? false }
        self.registry.add(playlist)
        return playlist
      }

      Function("play") { playlist in
        playlist.play()
      }

      Function("destroy") { playlist in
        if playlist.isActiveForLockScreen {
          playlist.setActiveForLockScreen(false, metadata: nil, options: nil)
        }
        playlist.endSessionUse()
        self.registry.remove(playlist)
      }
    }

    #if os(iOS)
    Class(AudioRecorder.self) {
      Constructor { (options: RecordingOptions) -> AudioRecorder in
        let recordingDir = try AudioUtils.recordingDirectory(for: options.directory, appContext: self.appContext)
        let avRecorder = try AudioUtils.createRecorder(directory: recordingDir, with: options)
        let recorder = AudioRecorder(avRecorder, options: options, session: self.session)
        let mode = self.currentMode
        recorder.owningRegistry = self.registry
        recorder.allowsRecording = mode.allowsRecording
        recorder.continuesInBackground = mode.allowsBackgroundRecording
        self.registry.add(recorder)

        return recorder
      }
    }

    Class(AudioStream.self) {
      Constructor { (options: AudioStreamOptions) -> AudioStream in
        let stream = AudioStream(options: options, session: self.session)
        stream.allowsBackgroundRecording = { [weak self] in self?.currentMode.allowsBackgroundRecording ?? false }
        return stream
      }
    }
    #endif
  }

  fileprivate func handleMediaServicesReset() {
    #if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      recorder.sessionUse.sync {
        recorder.handleMediaServicesReset()
      }
    }
    #endif

    registry.allPlayers.values.forEach { player in
      player.sessionUse.sync {
        if player.isPlaying {
          player.wasPlaying = true
        }
        player.handleMediaServicesReset()
      }
    }
  }

  private func canStartPlayback() -> Bool {
    guard audioEnabled.withLock({ $0 }) else {
      log.warn("[expo-audio] Ignoring play() because audio is disabled. Call setIsAudioActiveAsync(true) to re-enable playback.")
      return false
    }
    return true
  }

  private func withPermissionsContinuation(
    _ body: (@escaping EXPromiseResolveBlock, @escaping EXPromiseRejectBlock) -> Void
  ) async throws -> [String: Any] {
    return try await withCheckedThrowingContinuation { continuation in
      let resolve: EXPromiseResolveBlock = { result in
        continuation.resume(returning: result as? [String: Any] ?? [:])
      }
      let reject: EXPromiseRejectBlock = { code, message, _ in
        continuation.resume(throwing: Exception(name: code ?? "", description: message ?? "", code: code ?? ""))
      }
      body(resolve, reject)
    }
  }
}

private final class ServicesResetObserver: MediaSessionObserver {
  private weak var module: AudioModule?

  init(module: AudioModule) {
    self.module = module
  }

  func mediaSessionServicesReset() {
    DispatchQueue.main.async { [weak module] in
      module?.handleMediaServicesReset()
    }
  }
}
