import ExpoModulesCore

public class AudioModule: Module {
  private var sessionIsActive = true
  private let registry = AudioComponentRegistry()

  // MARK: Properties
  private var recordingSettings = [String: Any]()
  private var shouldPlayInBackground = false
  private var interruptionMode: InterruptionMode = .mixWithOthers
  private var interruptedPlayers = Set<String>()
  private var playerVolumes = [String: Float]()
  private var allowsRecording = false
  private var sessionOptions: AVAudioSession.CategoryOptions = []

  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      #if os(iOS)
      self.appContext?.permissions?.register([
        AudioRecordingRequester()
      ])

      setupInterruptionHandling()
      #endif
    }

    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try setAudioMode(mode: mode)
    }

    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
      try setIsAudioActive(isActive)
    }

    AsyncFunction("requestRecordingPermissionsAsync") { (promise: Promise) in
      #if os(iOS)
      appContext?.permissions?.askForPermission(
        usingRequesterClass: AudioRecordingRequester.self,
        resolve: promise.resolver,
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
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
      #else
      promise.reject(Exception.init(name: "UnsupportedOperation", description: "Audio recording is not supported on this platform."))
      #endif
    }

    OnDestroy {
      registry.removeAll()
      NotificationCenter.default.removeObserver(self)
    }

    OnAppEntersBackground {
      if !shouldPlayInBackground {
        pauseAllPlayers()
      }
    }

    OnAppEntersForeground {
      if !shouldPlayInBackground {
        resumeAllPlayers()
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(AudioPlayer.self) {
      Constructor { (source: AudioSource?, updateInterval: Double) -> AudioPlayer in
        let avPlayer = AudioUtils.createAVPlayer(from: source)
        let player = AudioPlayer(avPlayer, interval: updateInterval)
        player.owningRegistry = self.registry
        player.onPlaybackComplete = { [weak self] in
          self?.deactivateSession()
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
        try activateSession()
        let rate = player.currentRate > 0 ? player.currentRate : 1.0
        player.play(at: rate)
      }

      Function("setPlaybackRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        let playerRate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        player.currentRate = playerRate

        if player.isPlaying {
          player.ref.rate = playerRate
        }

        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .varispeed
          player.ref.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        }
      }

      Function("replace") { (player, source: AudioSource) in
        player.replaceCurrentSource(source: source)
      }

      Function("pause") { player in
        player.ref.pause()
        deactivateSession()
      }

      Function("remove") { player in
        self.registry.remove(player)
      }

      Function("setAudioSamplingEnabled") { (player, enabled: Bool) in
        if player.samplingEnabled != enabled {
          player.setSamplingEnabled(enabled: enabled)
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

    #if os(iOS)
    // swiftlint:disable:next closure_body_length
    Class(AudioRecorder.self) {
      Constructor { (options: RecordingOptions) -> AudioRecorder in
        let recordingDir = try recordingDirectory()
        let avRecorder = AudioUtils.createRecorder(directory: recordingDir, with: options)
        let recorder = AudioRecorder(avRecorder)
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
    interruptedPlayers.removeAll()
    playerVolumes.removeAll()

    registry.allPlayers.values.forEach { player in
      if player.isPlaying {
        interruptedPlayers.insert(player.id)
        switch interruptionMode {
        case .duckOthers:
          playerVolumes[player.id] = player.ref.volume
          player.ref.volume *= 0.5
        case .doNotMix, .mixWithOthers:
          player.ref.pause()
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
    do {
      try AVAudioSession.sharedInstance().setActive(true, options: [.notifyOthersOnDeactivation])
      if options.contains(.shouldResume) {
        resumeInterruptedPlayers()
      }
    } catch {
      print("Failed to reactivate audio session: \(error)")
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

  private func resumeInterruptedPlayers() {
    registry.allPlayers.values.forEach { player in
      if interruptedPlayers.contains(player.id) {
        switch interruptionMode {
        case .duckOthers:
          if let originalVolume = playerVolumes[player.id] {
            player.ref.volume = originalVolume
          }
        case .doNotMix, .mixWithOthers:
          player.ref.play()
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
    registry.allPlayers.values.forEach { player in
      if player.isPlaying {
        player.wasPlaying = true
        player.ref.pause()
      }
    }
  }

  private func resumeAllPlayers() {
    registry.allPlayers.values.forEach { player in
      if player.wasPlaying {
        player.ref.play()
        player.wasPlaying = false
      }
    }
  }

  private func recordingDirectory() throws -> URL {
    guard let cachesDir = appContext?.fileSystem?.cachesDirectory else {
      throw Exceptions.AppContextLost()
    }
    return URL(fileURLWithPath: cachesDir)
  }

  private func setIsAudioActive(_ isActive: Bool) throws {
    if !isActive {
      pauseAllPlayers()
    }

    do {
      try AVAudioSession.sharedInstance().setActive(isActive, options: [.notifyOthersOnDeactivation])
      sessionIsActive = isActive
    } catch {
      throw AudioStateException(error.localizedDescription)
    }
  }

  private func setAudioMode(mode: AudioMode) throws {
    try AudioUtils.validateAudioMode(mode: mode)
    let session = AVAudioSession.sharedInstance()
    var category: AVAudioSession.Category = session.category

    self.shouldPlayInBackground = mode.shouldPlayInBackground
    self.interruptionMode = mode.interruptionMode
    self.allowsRecording = mode.allowsRecording

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
        categoryOptions.insert(.allowBluetooth)
      }
#endif

      sessionOptions = categoryOptions
    }

    try session.setCategory(category, options: sessionOptions)
  }

  private func activateSession() throws {
    try AVAudioSession.sharedInstance().setActive(true, options: [.notifyOthersOnDeactivation])
  }

  private func deactivateSession() {
    // We need to give isPlaying time to update before running this
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
      guard let self else {
        return
      }
      let hasActivePlayers = self.registry.allPlayers.values.contains { $0.isPlaying }
      if !hasActivePlayers {
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
