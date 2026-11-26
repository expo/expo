import ExpoModulesCore

@ExpoModule("ExpoAudio")
public final class AudioModule: Module {
  private let registry = AudioComponentRegistry()

  private let sessionQueue = DispatchQueue(label: "expo.modules.audio.session", qos: .userInitiated)
  private var sessionIsActive = false
  private var audioSessionActivityKeepers = Set<String>()
  private let audioEnabled = Mutex(true)

  // MARK: Properties
  private var recordingSettings = [String: Any]()
  // Written only on the `sessionQueue`.
  private let modeFlags = Mutex(ModeFlags())
  private var interruptedPlayers = Set<String>()
  private var playerVolumes = [String: Float]()
  private var sessionOptions: AVAudioSession.CategoryOptions = []
  private(set) var lastConfiguredMode: AudioMode?

  public override func didCreate() {
    #if os(iOS)
    appContext?.permissions?.register([
      AudioRecordingRequester()
    ])
    #endif

    setupInterruptionHandling()
  }

  public override func willDestroy() {
    registry.removeAllPreloadedPlayers()
    registry.removeAll()
    NotificationCenter.default.removeObserver(self)
    sessionQueue.async {
      self.audioSessionActivityKeepers.removeAll()
      if self.sessionIsActive {
        self.applySessionActive(false)
      }
    }
  }

  @MainActor
  public override func appDidEnterBackground() {
    let flags = modeFlags.withLock { $0 }
    if !flags.shouldPlayInBackground {
      pauseAllPlayers()
    }
    #if os(iOS)
    if !flags.allowsBackgroundRecording {
      pauseAllRecorders()
    }
    #endif
  }

  @MainActor
  public override func appWillEnterForeground() {
    let flags = modeFlags.withLock { $0 }
    if !flags.shouldPlayInBackground {
      resumeAllPlayers()
    }
    #if os(iOS)
    if !flags.allowsBackgroundRecording {
      resumeAllRecorders()
    }
    #endif
  }

  @JS
  func setAudioModeAsync(_ mode: PartialAudioMode) async throws {
    try await sessionQueue.perform {
      try self.setAudioMode(mode: mode.merged(into: self.lastConfiguredMode ?? AudioMode()))
    }
  }

  @JS
  func setIsAudioActiveAsync(_ isActive: Bool) async throws {
    try await sessionQueue.perform {
      try self.setIsAudioActive(isActive)
    }
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
        let player = AudioPlayer(avPlayer, interval: updateInterval, source: source)
        player.owningRegistry = self.registry
        player.keepAudioSessionActive = keepAudioSessionActive
        // Store the preference so it is re-applied whenever the item is replaced.
        player.preferredForwardBufferDuration = preferredForwardBufferDuration
        let playerId = player.id
        player.onRelease = { [weak audioModule = self] in
          audioModule?.unregisterAudioSessionActivityKeeper(playerId)
        }
        player.onPlaybackComplete = { [weak self] in
          if !keepAudioSessionActive {
            self?.deactivateSession()
          }
        }
        self.registry.add(player)
        return player
      }

      Property("id") { player in
        player.id
      }

      Property("isAudioSamplingSupported") {
        true
      }

      Property("isBuffering") { player in
        player.isBuffering
      }

      Property("loop") { player in
        player.isLooping
      }.set { (player, isLooping: Bool) in
        player.isLooping = isLooping
      }

      Property("isLoaded") { player in
        player.isLoaded
      }

      Property("playing") { player in
        player.isPlaying
      }

      Property("muted") { player in
        player.ref.isMuted
      }.set { (player, isMuted: Bool) in
        player.ref.isMuted = isMuted
      }

      Property("shouldCorrectPitch") { player in
        player.shouldCorrectPitch
      }.set { (player, shouldCorrectPitch: Bool) in
        player.shouldCorrectPitch = shouldCorrectPitch
      }

      Property("currentTime") { player in
        player.currentTime
      }

      Property("duration") { player in
        player.ref.status == .readyToPlay ? player.duration : 0.0
      }

      Property("playbackRate") { player in
        return if player.isPlaying {
          player.ref.rate
        } else {
          player.currentRate
        }
      }.set { (player, rate: Double) in
        // Keep the pitch correction quality from the last `setPlaybackRate` call.
        player.setPlaybackRate(rate, pitchCorrectionQuality: player.pitchCorrectionQuality)
      }

      Property("paused") { player in
        player.isPaused
      }

      Property("volume") { player in
        player.ref.volume
      }.set { (player, volume: Double) in
        player.ref.volume = Float(volume)
      }

      Property("currentStatus") { player in
        player.currentStatus()
      }

      Property("isActiveForLockScreen") { player in
        player.isActiveForLockScreen
      }

      Function("play") { player in
        guard self.canStartPlayback() else {
          return
        }
        let rate = player.currentRate > 0 ? player.currentRate : 1.0
        player.play(at: rate)
        self.activateSession(for: player) { [weak self, weak player] message in
          player?.pause()
          self?.appContext?.jsLogger.warn("[expo-audio] Playback was paused because the audio session could not be activated: \(message). Another app may hold a higher-priority session (for example, a phone call), or the app tried to activate a non-mixable session in the background. Call `play()` again later.")
        }
      }

      Function("setPlaybackRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        player.setPlaybackRate(rate, pitchCorrectionQuality: pitchCorrectionQuality?.toPitchAlgorithm() ?? .timeDomain)
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
        player.ref.pause()
        if !player.keepAudioSessionActive {
          self.deactivateSession()
        }
      }

      Function("remove") { player in
        self.registry.remove(player)
        self.unregisterAudioSessionActivityKeeper(player.id)
      }

      Function("setAudioSamplingEnabled") { (player, enabled: Bool) in
        if player.samplingEnabled != enabled {
          player.setSamplingEnabled(enabled: enabled)
        }
      }

      Function("setActiveForLockScreen") { (player: AudioPlayer, active: Bool, metadata: Metadata?, options: LockScreenOptions?) in
        player.setActiveForLockScreen(active, metadata: metadata, options: options)
      }

      Function("updateLockScreenMetadata") { (player: AudioPlayer, metadata: Metadata?) in
        if player.isActiveForLockScreen {
          player.metadata = metadata
          MediaController.shared.refreshActivePlayable(player, options: player.lockScreenOptions)
        }
      }

      Function("clearLockScreenControls") { (player: AudioPlayer) in
        if player.isActiveForLockScreen {
          player.metadata = nil
          player.lockScreenOptions = nil
          player.isActiveForLockScreen = false
          MediaController.shared.setActivePlayable(nil)
        }
      }

      AsyncFunction("seekTo") { (player: AudioPlayer, seconds: Double, toleranceMillisBefore: Double?, toleranceMillisAfter: Double?) in
        await player.seekTo(
          seconds: seconds,
          toleranceMillisBefore: toleranceMillisBefore,
          toleranceMillisAfter: toleranceMillisAfter
        )
      }
    }

    Class(AudioPlaylist.self) {
      Constructor { (sources: [AudioSource], updateInterval: Double, loopMode: LoopMode) -> AudioPlaylist in
        // Keep one slot per source, nil where an item can't be created, so playerItems stays aligned with sources.
        let items = sources.map { AudioUtils.createAVPlayerItem(from: $0) }
        let avQueuePlayer = AVQueuePlayer(items: items.compactMap { $0 })
        let playlist = AudioPlaylist(avQueuePlayer, sources: sources, items: items, interval: updateInterval, loopMode: loopMode)
        playlist.owningRegistry = self.registry
        self.registry.add(playlist)
        return playlist
      }

      Property("id") { playlist in
        playlist.id
      }

      Property("currentIndex") { playlist in
        playlist.currentTrackIndex
      }

      Property("trackCount") { playlist in
        playlist.trackCount
      }

      Property("sources") { playlist in
        playlist.getSourceInfo()
      }

      Property("playing") { playlist in
        playlist.isPlaying
      }

      Property("isLoaded") { playlist in
        playlist.isLoaded
      }

      Property("isBuffering") { playlist in
        playlist.isBuffering
      }

      Property("currentTime") { playlist in
        playlist.currentTime
      }

      Property("duration") { playlist in
        playlist.duration
      }

      Property("muted") { playlist in
        playlist.ref.isMuted
      }.set { (playlist, isMuted: Bool) in
        playlist.ref.isMuted = isMuted
      }

      Property("volume") { playlist in
        playlist.ref.volume
      }.set { (playlist, volume: Double) in
        playlist.ref.volume = Float(volume)
      }

      Property("playbackRate") { playlist in
        playlist.isPlaying ? playlist.ref.rate : playlist.currentRate
      }.set { (playlist, rate: Double) in
        playlist.setPlaybackRate(Float(rate))
      }

      Property("loop") { playlist in
        playlist.loopMode.rawValue
      }.set { (playlist, mode: LoopMode) in
        playlist.setLoopMode(mode)
      }

      Property("currentStatus") { playlist in
        playlist.currentStatus()
      }

      Property("isActiveForLockScreen") { playlist in
        playlist.isActiveForLockScreen
      }

      Function("play") { playlist in
        guard self.canStartPlayback() else {
          return
        }
        playlist.play(at: playlist.currentRate)
        self.activateSession()
      }

      Function("pause") { playlist in
        playlist.pause()
      }

      Function("next") { playlist in
        playlist.next()
      }

      Function("previous") { playlist in
        playlist.previous()
      }

      Function("skipTo") { (playlist, index: Int) in
        playlist.skipTo(index: index)
      }

      AsyncFunction("seekTo") { (playlist: AudioPlaylist, seconds: Double) in
        await playlist.seekTo(seconds: seconds)
      }

      Function("add") { (playlist, source: AudioSource) in
        playlist.add(source: source)
      }

      Function("insert") { (playlist, source: AudioSource, index: Int) in
        playlist.insert(source: source, at: index)
      }

      Function("remove") { (playlist, index: Int) in
        playlist.remove(at: index)
      }

      Function("clear") { playlist in
        playlist.clear()
      }

      Function("setActiveForLockScreen") { (playlist: AudioPlaylist, active: Bool, metadata: Metadata?, options: LockScreenOptions?) in
        playlist.setActiveForLockScreen(active, metadata: metadata, options: options)
      }

      Function("updateLockScreenMetadata") { (playlist: AudioPlaylist, metadata: Metadata?) in
        if playlist.isActiveForLockScreen {
          playlist.metadata = metadata
          MediaController.shared.refreshActivePlayable(playlist, options: playlist.lockScreenOptions)
        }
      }

      Function("clearLockScreenControls") { (playlist: AudioPlaylist) in
        if playlist.isActiveForLockScreen {
          playlist.metadata = nil
          playlist.lockScreenOptions = nil
          playlist.isActiveForLockScreen = false
          MediaController.shared.setActivePlayable(nil)
        }
      }

      Function("destroy") { playlist in
        if playlist.isActiveForLockScreen {
          playlist.setActiveForLockScreen(false, metadata: nil, options: nil)
        }
        self.registry.remove(playlist)
      }
    }

    #if os(iOS)
    Class(AudioRecorder.self) {
      Constructor { (options: RecordingOptions) -> AudioRecorder in
        let recordingDir = try AudioUtils.recordingDirectory(for: options.directory, appContext: self.appContext)
        let avRecorder = try AudioUtils.createRecorder(directory: recordingDir, with: options)
        let recorder = AudioRecorder(avRecorder, options: options, sessionQueue: self.sessionQueue)
        recorder.owningRegistry = self.registry
        recorder.module = self
        recorder.allowsRecording = self.modeFlags.withLock { $0.allowsRecording }
        self.registry.add(recorder)

        return recorder
      }
    }

    Class(AudioStream.self) {
      Constructor { (options: AudioStreamOptions) -> AudioStream in
        let stream = AudioStream(options: options, sessionQueue: self.sessionQueue)
        stream.module = self
        return stream
      }

      Function("stop") { (stream: AudioStream) in
        stream.stop()
        self.deactivateSession()
      }
    }
    #endif
  }

  private func setupInterruptionHandling() {
    let session = AVAudioSession.sharedInstance()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioSessionInterruption(_:)),
      name: AVAudioSession.interruptionNotification,
      object: session
    )

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAudioSessionRouteChange(_:)),
      name: AVAudioSession.routeChangeNotification,
      object: session
    )

    #if os(iOS)
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleMediaServicesReset(_:)),
      name: AVAudioSession.mediaServicesWereResetNotification,
      object: session
    )
    #endif
  }

  @objc private func handleAudioSessionInterruption(_ notification: Notification) {
    guard let userInfo = notification.userInfo,
      let interruptionTypeRaw = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
      let interruptionType = AVAudioSession.InterruptionType(rawValue: interruptionTypeRaw) else {
      return
    }

    switch interruptionType {
    case .began:
      handleInterruptionBegan()

    case .ended:
      if let optionsRaw = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
        let options = AVAudioSession.InterruptionOptions(rawValue: optionsRaw)
        handleInterruptionEnded(with: options)
      } else {
        handleInterruptionEnded(with: [])
      }

    @unknown default:
      break
    }
  }

  private func handleInterruptionBegan() {
    // Capture which players are playing before dispatching work to the `sessionQueue`.
    // If a player is auto-paused while the `sessionQueue` is busy, a later check would
    // miss it and it would never resume.
    var interrupted = Set<String>()
    var volumes = [String: Float]()

    let interruptionMode = modeFlags.withLock { $0.interruptionMode }
    registry.allPlayables.forEach { playable in
      if playable.isPlaying {
        interrupted.insert(playable.id)
        switch interruptionMode {
        case .duckOthers:
          volumes[playable.id] = playable.volume
          playable.volume *= 0.5
        case .doNotMix, .doNotMixPersistent, .mixWithOthers:
          playable.pause()
        }
      }
    }

#if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      recorder.pauseForSystem()
    }
#endif

    sessionQueue.async { [weak self] in
      guard let self else {
        return
      }
      self.interruptedPlayers = interrupted
      self.playerVolumes = volumes
      self.sessionIsActive = false
    }
  }

  private func handleInterruptionEnded(with options: AVAudioSession.InterruptionOptions) {
    sessionQueue.async { [weak self] in
      guard let self, self.audioEnabled.withLock({ $0 }), self.applySessionActive(true) == nil else {
        return
      }
      if options.contains(.shouldResume) {
        self.resumeInterruptedPlayers()
      }
    }
  }

  @objc private func handleAudioSessionRouteChange(_ notification: Notification) {
    guard let userInfo = notification.userInfo,
      let reasonRaw = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
      let reason = AVAudioSession.RouteChangeReason(rawValue: reasonRaw) else {
      return
    }

    switch reason {
    case .oldDeviceUnavailable:
      pauseAllPlayers()
    default:
      break
    }
  }

  #if os(iOS)
  @objc private func handleMediaServicesReset(_ notification: Notification) {
    reconfigureAudioSession()

    registry.allRecorders.values.forEach { recorder in
      recorder.handleMediaServicesReset()
    }

    registry.allPlayers.values.forEach { player in
      if player.isPlaying {
        player.wasPlaying = true
      }
      player.handleMediaServicesReset()
    }
  }

  private func reconfigureAudioSession() {
    sessionQueue.async { [weak self] in
      guard let self else {
        return
      }
      do {
        if let mode = self.lastConfiguredMode {
          try self.setAudioMode(mode: mode)
        }
      } catch {
        log.warn("[expo-audio] Failed to reconfigure the audio session after a media services reset: \(error.localizedDescription)")
        return
      }
      guard self.audioEnabled.withLock({ $0 }) else {
        self.sessionIsActive = false
        return
      }
      self.applySessionActive(true)
    }
  }
  #endif

  private func resumeInterruptedPlayers() {
    let interruptionMode = modeFlags.withLock { $0.interruptionMode }
    registry.allPlayables.forEach { playable in
      if interruptedPlayers.contains(playable.id) {
        switch interruptionMode {
        case .duckOthers:
          if let originalVolume = playerVolumes[playable.id] {
            playable.volume = originalVolume
          }
        case .doNotMix, .doNotMixPersistent, .mixWithOthers:
          playable.resumePlayback()
        }
      }
    }

#if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      try? recorder.resumeAfterSystemPause()
    }
#endif

    interruptedPlayers.removeAll()
    playerVolumes.removeAll()
  }

  private func pauseAllPlayers() {
    registry.allPlayables.forEach { playable in
      if playable.isPlaying {
        playable.wasPlaying = true
        playable.pause()
      }
    }
  }

  private func resumeAllPlayers() {
    registry.allPlayables.forEach { playable in
      if playable.wasPlaying {
        playable.resumePlayback()
        playable.wasPlaying = false
      }
    }
  }

  private func pauseAllRecorders() {
#if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      recorder.pauseForSystem()
    }
#endif
  }

  private func resumeAllRecorders() {
#if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      try? recorder.resumeAfterSystemPause()
    }
#endif
  }

  func activateRecordingSession(
    _ body: (_ sessionOptions: AVAudioSession.CategoryOptions, _ deactivateOnFailure: Bool) throws -> Void
  ) rethrows {
    dispatchPrecondition(condition: .onQueue(sessionQueue))
    try body(sessionOptions, !sessionIsActive && audioSessionActivityKeepers.isEmpty)
    sessionIsActive = true
  }

  private func setIsAudioActive(_ isActive: Bool) throws {
    audioEnabled.withLock { $0 = isActive }
    if !isActive {
      pauseAllPlayers()
    }
    do {
      try AVAudioSession.sharedInstance().setActive(isActive, options: activationOptions(isActive: isActive))
    } catch {
      throw AudioStateException(error.localizedDescription)
    }
    sessionIsActive = isActive
    if !isActive {
      audioSessionActivityKeepers.removeAll()
    }
  }

  private func setAudioMode(mode: AudioMode) throws {
    try AudioUtils.validateAudioMode(mode: mode)
    let session = AVAudioSession.sharedInstance()
    var category: AVAudioSession.Category = session.category

    self.lastConfiguredMode = mode
    modeFlags.withLock {
      $0 = ModeFlags(
        shouldPlayInBackground: mode.shouldPlayInBackground,
        interruptionMode: mode.interruptionMode,
        allowsRecording: mode.allowsRecording,
        allowsBackgroundRecording: mode.allowsBackgroundRecording
      )
    }

    #if os(iOS)
    if !mode.allowsRecording {
      registry.allRecorders.values.forEach { recorder in
        if recorder.isRecording {
          recorder.ref.stop()
        }
        recorder.allowsRecording = false
      }
    } else {
      registry.allRecorders.values.forEach { recorder in
        recorder.allowsRecording = true
      }
    }
    #endif

    if !mode.playsInSilentMode {
      if mode.interruptionMode.preventsMixing {
        category = .soloAmbient
      } else {
        category = .ambient
      }
      sessionOptions = []
    } else {
      category = mode.allowsRecording ? .playAndRecord : .playback

      var categoryOptions: AVAudioSession.CategoryOptions = []
      switch mode.interruptionMode {
      case .doNotMix, .doNotMixPersistent:
        break
      case .duckOthers:
        categoryOptions.insert(.duckOthers)
      case .mixWithOthers:
        categoryOptions.insert(.mixWithOthers)
      }

#if !os(tvOS)
      if category == .playAndRecord {
        if !mode.shouldRouteThroughEarpiece {
          categoryOptions.insert(.defaultToSpeaker)
        }
#if compiler(>=6.2) // Xcode 26
        categoryOptions.insert(.allowBluetoothHFP)
#else
        categoryOptions.insert(.allowBluetooth)
#endif
      }
#endif

      sessionOptions = categoryOptions
    }

    if sessionOptions.isEmpty {
      try session.setCategory(category, mode: .default)
    } else {
      try session.setCategory(category, options: sessionOptions)
    }
  }

  private func canStartPlayback() -> Bool {
    guard audioEnabled.withLock({ $0 }) else {
      log.warn("[expo-audio] Ignoring play() because audio is disabled. Call setIsAudioActiveAsync(true) to re-enable playback.")
      return false
    }
    return true
  }

  private func activateSession() {
    sessionQueue.async { [weak self] in
      guard let self, self.audioEnabled.withLock({ $0 }), !self.sessionIsActive else {
        return
      }
      self.applySessionActive(true)
    }
  }

  private func activateSession(for player: AudioPlayer, onError: ((String) -> Void)? = nil) {
    let playerId = player.id
    let shouldKeepSessionActive = player.keepAudioSessionActive
    sessionQueue.async { [weak self] in
      guard let self, self.audioEnabled.withLock({ $0 }) else {
        return
      }

      let didRegisterActivityKeeper = shouldKeepSessionActive && self.registerAudioSessionActivityKeeper(playerId)
      guard !self.sessionIsActive else {
        return
      }
      if let error = self.applySessionActive(true) {
        if didRegisterActivityKeeper {
          self.audioSessionActivityKeepers.remove(playerId)
        }
        onError?(error.localizedDescription)
      }
    }
  }

  private func activationOptions(isActive: Bool) -> AVAudioSession.SetActiveOptions {
    guard !isActive, modeFlags.withLock({ $0.interruptionMode }).shouldNotifyOthersOnDeactivation else {
      return []
    }

    return [.notifyOthersOnDeactivation]
  }

  private func deactivateSession() {
    sessionQueue.asyncAfter(deadline: .now() + .milliseconds(100)) { [weak self] in
      guard let self,
        self.sessionIsActive,
        self.audioSessionActivityKeepers.isEmpty,
        !self.isSessionInUse else {
        return
      }
      self.applySessionActive(false)
    }
  }

  private func registerAudioSessionActivityKeeper(_ playerId: String) -> Bool {
    return audioSessionActivityKeepers.insert(playerId).inserted
  }

  private func unregisterAudioSessionActivityKeeper(_ playerId: String) {
    sessionQueue.async { [weak self] in
      guard let self, self.audioSessionActivityKeepers.remove(playerId) != nil else {
        return
      }
      self.deactivateSession()
    }
  }

  @discardableResult
  private func applySessionActive(_ isActive: Bool) -> Error? {
    do {
      try AVAudioSession.sharedInstance().setActive(isActive, options: activationOptions(isActive: isActive))
      sessionIsActive = isActive
      return nil
    } catch {
      log.warn("[expo-audio] Failed to \(isActive ? "activate" : "deactivate") the audio session: \(error.localizedDescription)")
      return error
    }
  }

  private var isSessionInUse: Bool {
    if registry.allPlayables.contains(where: { $0.isPlaying }) {
      return true
    }
    #if os(iOS)
    return registry.allRecorders.values.contains { $0.isRecording }
    #else
    return false
    #endif
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

private struct ModeFlags {
  var shouldPlayInBackground = false
  var interruptionMode: InterruptionMode = .mixWithOthers
  var allowsRecording = false
  var allowsBackgroundRecording = false
}
