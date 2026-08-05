import ExpoModulesCore

public class AudioModule: Module {
  private let registry = AudioComponentRegistry()

  // MARK: Properties
  private var recordingSettings = [String: Any]()
  private var shouldPlayInBackground = false
  private var interruptionMode: InterruptionMode = .mixWithOthers
  private var interruptedPlayers = Set<String>()
  private var playerVolumes = [String: Float]()
  private var allowsRecording = false
  private var allowsBackgroundRecording = false
  private var sessionOptions: AVAudioSession.CategoryOptions = []
  private var lastConfiguredMode: AudioMode?

  // AVAudioSession.setActive(_:) is a synchronous XPC round-trip to the audio
  // daemon that can stall for seconds (or indefinitely) under system contention.
  // This module's session transitions run on this serial queue so a stall can
  // never block the calling thread — for the sync `play` Functions that caller
  // is the JS thread, and a blocked JS thread freezes every JS timer and state
  // update in the app. The interruption bookkeeping (interruptedPlayers /
  // playerVolumes) also lives on this queue. sessionActivation lets a later
  // activation supersede a pending deactivation so back-to-back playback isn't
  // torn down by a stale setActive(false). (AudioRecorder/AudioStream still
  // activate the session inline outside this queue — a known gap, tracked for
  // a follow-up.)
  private let sessionQueue = DispatchQueue(label: "expo.modules.audio.session")
  private let sessionActivation = MonotonicGeneration()

  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      #if os(iOS)
      self.appContext?.permissions?.register([
        AudioRecordingRequester()
      ])
      #endif

      setupInterruptionHandling()
    }

    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try setAudioMode(mode: mode)
    }

    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool, promise: Promise) in
      setIsAudioActive(isActive, promise: promise)
    }

    AsyncFunction("requestRecordingPermissionsAsync") { (promise: Promise) in
      #if os(iOS)
      appContext?.permissions?.askForPermission(
        usingRequesterClass: AudioRecordingRequester.self,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
      #else
      promise.reject(Exception.init(name: "UnsupportedOperation", description: "Audio recording is not supported on this platform."))
      #endif
    }

    AsyncFunction("getRecordingPermissionsAsync") { (promise: Promise) in
      #if os(iOS)
      appContext?.permissions?.getPermissionUsingRequesterClass(
        AudioRecordingRequester.self,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
      #else
      promise.reject(Exception.init(name: "UnsupportedOperation", description: "Audio recording is not supported on this platform."))
      #endif
    }

    AsyncFunction("preload") { (source: AudioSource, preferredForwardBufferDuration: Double) in
      guard let uri = source.uri else {
        return
      }
      let key = uri.absoluteString
      if self.registry.hasPreloadedPlayer(forKey: key) {
        return
      }
      let player = AudioUtils.createAVPlayer(from: source)
      player.currentItem?.preferredForwardBufferDuration = preferredForwardBufferDuration
      self.registry.addPreloadedPlayer(player, forKey: key)
    }

    AsyncFunction("clearPreloadedSource") { (source: AudioSource) in
      guard let uri = source.uri else {
        return
      }
      let key = uri.absoluteString
      _ = self.registry.removePreloadedPlayer(forKey: key)
    }

    AsyncFunction("clearAllPreloadedSources") {
      self.registry.removeAllPreloadedPlayers()
    }

    AsyncFunction("getPreloadedSources") {
      self.registry.preloadedPlayerKeys()
    }

    OnDestroy {
      registry.removeAllPreloadedPlayers()
      registry.removeAll()
      NotificationCenter.default.removeObserver(self)
    }

    OnAppEntersBackground {
      if !shouldPlayInBackground {
        pauseAllPlayers()
      }
      #if os(iOS)
      if !allowsBackgroundRecording {
        pauseAllRecorders()
      }
      #endif
    }

    OnAppEntersForeground {
      if !shouldPlayInBackground {
        resumeAllPlayers()
      }
      #if os(iOS)
      if !allowsBackgroundRecording {
        resumeAllRecorders()
      }
      #endif
    }

    // swiftlint:disable:next closure_body_length
    Class(AudioPlayer.self) {
      Constructor { (source: AudioSource?, updateInterval: Double, keepAudioSessionActive: Bool, preferredForwardBufferDuration: Double, allowsExternalPlayback: Bool) -> AudioPlayer in
        let avPlayer: AVPlayer
        if let uri = source?.uri?.absoluteString, let cachedPlayer = self.registry.removePreloadedPlayer(forKey: uri) {
          avPlayer = cachedPlayer
        } else {
          avPlayer = AudioUtils.createAVPlayer(from: source)
          if preferredForwardBufferDuration > 0 {
            avPlayer.currentItem?.preferredForwardBufferDuration = preferredForwardBufferDuration
          }
        }
        avPlayer.allowsExternalPlayback = allowsExternalPlayback
        let player = AudioPlayer(avPlayer, interval: updateInterval, source: source)
        player.owningRegistry = self.registry
        player.keepAudioSessionActive = keepAudioSessionActive
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

      Function("play") { player in
        // Sync Functions execute inline on the JS thread, so the blocking
        // setActive(true) must not happen here. Observer registration runs now
        // (on the JS thread, where the player's other mutations happen); only
        // the AVPlayer start is deferred behind activation on sessionQueue,
        // and the generation guard skips it if pause()/replace()/teardown
        // superseded this play while it was queued.
        let rate = player.currentRate > 0 ? player.currentRate : 1.0
        player.prepareToPlay()
        let generation = player.playGeneration.current
        withSessionActivatedOnQueue({
          guard player.playGeneration.current == generation else {
            return
          }
          player.startPlayback(at: rate)
        }, onActivationError: { error in
          player.updateStatus(with: ["error": "Audio session activation failed: \(error.localizedDescription)"])
        })
      }

      Function("setPlaybackRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        let playerRate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        player.currentRate = playerRate

        if player.isPlaying {
          player.ref.rate = playerRate
        }

        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .timeDomain
          player.ref.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        } else {
          player.ref.currentItem?.audioTimePitchAlgorithm = .varispeed
        }
      }

      Function("replace") { (player, source: AudioSource?) in
        // Generation bumps live inside the player's replace/pause/teardown
        // methods so every superseding path invalidates a queued play.
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
        if !player.keepAudioSessionActive {
          deactivateSession()
        }
      }

      Function("remove") { player in
        // The player object may outlive registry removal; make sure a play
        // still queued behind a slow activation doesn't start it afterwards.
        player.playGeneration.bump()
        self.registry.remove(player)
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

      Function("play") { playlist in
        // Same JS-thread hazard and same split as AudioPlayer's play above.
        let rate = playlist.currentRate
        playlist.prepareToPlay()
        let generation = playlist.playGeneration.current
        withSessionActivatedOnQueue({
          guard playlist.playGeneration.current == generation else {
            return
          }
          playlist.startPlayback(at: rate)
        }, onActivationError: { error in
          playlist.updateStatus(with: ["error": "Audio session activation failed: \(error.localizedDescription)"])
        })
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
    // swiftlint:disable:next closure_body_length
    Class(AudioRecorder.self) {
      Constructor { (options: RecordingOptions) -> AudioRecorder in
        let recordingDir = try recordingDirectory(for: options.directory)
        let avRecorder = try AudioUtils.createRecorder(directory: recordingDir, with: options)
        let recorder = AudioRecorder(avRecorder, options: options)
        recorder.owningRegistry = self.registry
        recorder.allowsRecording = allowsRecording
        self.registry.add(recorder)

        return recorder
      }

      Property("id") { recorder in
        recorder.id
      }

      Property("isRecording") { recorder in
        recorder.isRecording
      }

      Property("currentTime") { recorder in
        recorder.ref.currentTime
      }

      Property("uri") { recorder in
        recorder.uri
      }

      AsyncFunction("prepareToRecordAsync") { (recorder, options: RecordingOptions?) in
        try recorder.prepare(options: options, sessionOptions: sessionOptions)
      }

      Function("record") { (recorder: AudioRecorder, options: RecordOptions?) in
        try checkPermissions()

        switch (options?.atTime, options?.forDuration) {
        case let (atTime?, forDuration?):
          // Convert relative delay to absolute device time
          let absoluteTime = recorder.ref.deviceCurrentTime + TimeInterval(atTime)
          recorder.ref.record(atTime: absoluteTime, forDuration: TimeInterval(forDuration))
          recorder.updateStateForDirectRecording()
          return recorder.getRecordingStatus()
        case let (atTime?, nil):
          // Convert relative delay to absolute device time
          let absoluteTime = recorder.ref.deviceCurrentTime + TimeInterval(atTime)
          recorder.ref.record(atTime: absoluteTime)
          recorder.updateStateForDirectRecording()
          return recorder.getRecordingStatus()
        case let (nil, forDuration?):
          recorder.ref.record(forDuration: TimeInterval(forDuration))
          recorder.updateStateForDirectRecording()
          return recorder.getRecordingStatus()
        case (nil, nil):
          return try recorder.startRecording()
        }
      }

      Function("pause") { recorder in
        try checkPermissions()
        recorder.pauseRecording()
      }

      AsyncFunction("stop") { recorder in
        try checkPermissions()
        recorder.stopRecording()
      }

      Function("getStatus") { recorder -> [String: Any] in
        recorder.getRecordingStatus()
      }

      Function("startRecordingAtTime") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.ref.record(atTime: TimeInterval(seconds))
      }

      Function("recordForDuration") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.ref.record(forDuration: TimeInterval(seconds))
      }

      Function("getAvailableInputs") {
        RecordingUtils.getAvailableInputs()
      }

      Function("getCurrentInput") { () -> [String: Any] in
        try RecordingUtils.getCurrentInput()
      }

      Function("setInput") { (input: String) in
        try RecordingUtils.setInput(input)
      }
    }

    Class(AudioStream.self) {
      Constructor { (options: AudioStreamOptions) -> AudioStream in
        return AudioStream(options: options)
      }

      Property("id") { (stream: AudioStream) in
        stream.id
      }

      Property("sampleRate") { (stream: AudioStream) in
        stream.sampleRate
      }

      Property("channels") { (stream: AudioStream) in
        stream.channels
      }

      Property("isStreaming") { (stream: AudioStream) in
        stream.isStreaming
      }

      AsyncFunction("start") { (stream: AudioStream) in
        try checkPermissions()
        try stream.start()
      }

      Function("stop") { (stream: AudioStream) in
        stream.stop()
      }

      AsyncFunction("startFileRecordingAsync") { (stream: AudioStream, options: AudioStreamFileRecordingOptions?) throws -> AudioStreamFileRecordingStartResult in
        let opts = options ?? AudioStreamFileRecordingOptions()
        let format = opts.format
        let url: URL
        if let uri = opts.uri {
          guard uri.pathExtension.lowercased() == format.fileExtension else {
            throw AudioStreamFileException(
              "The URI '\(uri.lastPathComponent)' has extension '.\(uri.pathExtension.lowercased())' but the chosen format is '\(format.rawValue)'. Change the URI extension or the format to match."
            )
          }
          url = uri
        } else {
          let baseDir = try recordingDirectory(for: opts.directory)
          let streamDir = baseDir.appendingPathComponent("AudioStream")
          try FileManager.default.createDirectory(at: streamDir, withIntermediateDirectories: true)
          url = streamDir.appendingPathComponent("stream-\(UUID().uuidString).\(format.fileExtension)")
        }
        let resolvedUri = try stream.startFileRecording(url: url, format: format)
        return AudioStreamFileRecordingStartResult(uri: resolvedUri)
      }

      AsyncFunction("stopFileRecordingAsync") { (stream: AudioStream) throws -> AudioStreamFileRecordingResult in
        return try stream.stopFileRecording()
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
    // Runs on sessionQueue: interruptedPlayers/playerVolumes are also read and
    // mutated by resumeInterruptedPlayers, which executes there (queued behind
    // the reactivation). Back-to-back interruptions would otherwise mutate
    // these collections from the notification thread while a queued resume
    // iterates them.
    sessionQueue.async {
      self.handleInterruptionBeganOnSessionQueue()
    }
  }

  private func handleInterruptionBeganOnSessionQueue() {
    interruptedPlayers.removeAll()
    playerVolumes.removeAll()

    registry.allPlayables.forEach { playable in
      if playable.isPlaying {
        interruptedPlayers.insert(playable.id)
        switch interruptionMode {
        case .duckOthers:
          playerVolumes[playable.id] = playable.volume
          playable.volume *= 0.5
        case .doNotMix, .mixWithOthers:
          playable.pause()
        }
      }
    }

#if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      if recorder.isRecording {
        recorder.pauseRecording()
      }
    }
#endif
  }

  private func handleInterruptionEnded(with options: AVAudioSession.InterruptionOptions) {
    // Activation ordered on sessionQueue with resume kept after it. Resume is
    // attempted even if activation throws — activation failures are frequently
    // transient and dropping the resume silently is worse.
    withSessionActivatedOnQueue { [weak self] in
      if options.contains(.shouldResume) {
        self?.resumeInterruptedPlayers()
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
      // On sessionQueue for ordering with queued plays/resumes; pause() bumps
      // each player's generation so a queued play can't undo this pause.
      sessionQueue.async {
        self.pauseAllPlayers()
      }
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
    do {
      if let mode = lastConfiguredMode {
        try setAudioMode(mode: mode)
      }
    } catch {
      print("Failed to reconfigure audio session after media services reset: \(error)")
    }
    withSessionActivatedOnQueue()
  }
  #endif

  private func resumeInterruptedPlayers() {
    registry.allPlayables.forEach { playable in
      if interruptedPlayers.contains(playable.id) {
        switch interruptionMode {
        case .duckOthers:
          if let originalVolume = playerVolumes[playable.id] {
            playable.volume = originalVolume
          }
        case .doNotMix, .mixWithOthers:
          playable.resumePlayback()
        }
      }
    }

#if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      if recorder.allowsRecording && !recorder.isRecording {
        _ = try? recorder.startRecording()
      }
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
      if recorder.isRecording {
        recorder.pauseRecording()
      }
    }
#endif
  }

  private func resumeAllRecorders() {
#if os(iOS)
    registry.allRecorders.values.forEach { recorder in
      if recorder.allowsRecording && !recorder.isRecording {
        _ = try? recorder.startRecording()
      }
    }
#endif
  }

  private func recordingDirectory(for directory: RecordingDirectory?) throws -> URL {
    guard let fileSystem = appContext?.fileSystem else {
      throw Exceptions.AppContextLost()
    }
    let path = (directory ?? .cache) == .document ? fileSystem.documentDirectory : fileSystem.cachesDirectory
    return URL(fileURLWithPath: path)
  }

  private func setIsAudioActive(_ isActive: Bool, promise: Promise) {
    // Bump on activation so a pending deactivateSession() doesn't tear down
    // the session being explicitly activated here. The transition itself runs
    // async on sessionQueue and settles the promise from there — a stalled
    // setActive keeps the promise pending instead of blocking the process-wide
    // AsyncFunction queue that all Expo modules share.
    if isActive {
      sessionActivation.bump()
    }
    sessionQueue.async {
      if !isActive {
        self.pauseAllPlayers()
      }
      do {
        try AVAudioSession.sharedInstance().setActive(isActive, options: isActive ? [] : [.notifyOthersOnDeactivation])
        promise.resolve()
      } catch {
        promise.reject(AudioStateException(error.localizedDescription))
      }
    }
  }

  private func setAudioMode(mode: AudioMode) throws {
    try AudioUtils.validateAudioMode(mode: mode)
    let session = AVAudioSession.sharedInstance()
    var category: AVAudioSession.Category = session.category

    self.lastConfiguredMode = mode

    self.shouldPlayInBackground = mode.shouldPlayInBackground
    self.interruptionMode = mode.interruptionMode
    self.allowsRecording = mode.allowsRecording
    self.allowsBackgroundRecording = mode.allowsBackgroundRecording

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
      if mode.interruptionMode == .doNotMix {
        category = .soloAmbient
      } else {
        category = .ambient
      }
      sessionOptions = []
    } else {
      category = mode.allowsRecording ? .playAndRecord : .playback

      var categoryOptions: AVAudioSession.CategoryOptions = []
      switch mode.interruptionMode {
      case .doNotMix:
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

  private func withSessionActivatedOnQueue(
    _ then: @escaping () -> Void = {},
    onActivationError: ((Error) -> Void)? = nil
  ) {
    // AudioModule's activation path: session transitions are ordered against
    // deactivateSession on sessionQueue, and a stall can never wedge the
    // calling thread. The bump happens at call time so this activation
    // supersedes any pending deactivation.
    sessionActivation.bump()
    sessionQueue.async {
      do {
        try AVAudioSession.sharedInstance().setActive(true)
      } catch {
        // Run the continuation anyway: activation failures are frequently
        // transient, and for playback this keeps the player advancing to
        // didJustFinish so JS-side callers aren't left waiting forever on a
        // completion event that can no longer arrive. The play paths surface
        // the failure through the playbackStatusUpdate `error` field via
        // onActivationError.
        print("Failed to activate audio session: \(error)")
        onActivationError?(error)
      }
      then()
    }
  }

  private func deactivateSession() {
    // Capture the token now so a session reactivated before the deferred
    // deactivation runs skips this stale setActive(false).
    let requestedToken = sessionActivation.current
    Task {
      // Give isPlaying time to update before deciding whether to deactivate.
      try? await Task.sleep(for: .milliseconds(100))
      let hasActivePlayables = registry.allPlayables.contains { $0.isPlaying }
      guard !hasActivePlayables else {
        return
      }
      sessionQueue.async {
        // The token re-check and setActive(false) aren't atomic, leaving a
        // narrow TOCTOU window that iOS's session `isBusy` handling covers.
        guard self.sessionActivation.current == requestedToken else {
          return
        }
        do {
          try AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        } catch {
          print("Failed to deactivate audio session: \(error)")
        }
      }
    }
  }

  private func checkPermissions() throws {
    #if os(iOS)
    if #available(iOS 17.0, *) {
      switch AVAudioApplication.shared.recordPermission {
      case .denied, .undetermined:
        throw AudioPermissionsException()
      default:
        break
      }
    } else {
      switch AVAudioSession.sharedInstance().recordPermission {
      case .denied, .undetermined:
        throw AudioPermissionsException()
      default:
        break
      }
    }
    #endif
  }
}
