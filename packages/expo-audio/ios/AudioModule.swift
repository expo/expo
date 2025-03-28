import ExpoModulesCore

public class AudioModule: Module {
  private var sessionIsActive = true

  // MARK: Properties
  private var recordingSettings = [String: Any]()
  private var shouldPlayInBackground = false

  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      #if os(iOS)
      self.appContext?.permissions?.register([
        AudioRecordingRequester()
      ])
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
      AudioComponentRegistry.shared.removeAll()
    }

    OnAppEntersBackground {
      if !shouldPlayInBackground {
        AudioComponentRegistry.shared.players.values.forEach { player in
          if player.isPlaying {
            player.wasPlaying = true
            player.ref.pause()
          }
        }
      }
    }

    OnAppEntersForeground {
      if !shouldPlayInBackground {
        AudioComponentRegistry.shared.players.values.forEach { player in
          if player.wasPlaying {
            player.ref.play()
          }
        }
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(AudioPlayer.self) {
      Constructor { (sources: [AudioSource]?, updateInterval: Double) -> AudioPlayer in
        let avPlayer = AudioUtils.createAVPlayer()
        let player = AudioPlayer(avPlayer, interval: updateInterval)
        AudioComponentRegistry.shared.add(player)

        if let sources = sources, !sources.isEmpty {
          try player.setQueue(sources: sources)
        }

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
        player.ref.rate
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
        guard sessionIsActive else {
          return
        }
        let rate = player.currentRate > 0 ? player.currentRate : 1.0
        player.play(at: rate)
      }

      Function("setPlaybackRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        let playerRate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        player.ref.rate = playerRate
        player.currentRate = playerRate
        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .varispeed
          player.ref.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        }
      }

      Function("replace") { (player, source: AudioSource) in
        player.setQueue(sources: [source])
      }

      Function("setQueue") { (player, sources: [AudioSource]) in
        player.setQueue(sources: sources)
      }

      Function("getCurrentQueue") { player in
        player.getCurrentQueue()
      }

      Function("getCurrentQueueIndex") { player -> Any in
        let index = player.getCurrentQueueIndex()

        if index >= 0 {
          return index
        }
      return NSNull()
      }

      Function("addToQueue") { (player, sources: [AudioSource], insertBeforeIndex: Int?) in
        player.addToQueue(sources: sources, insertBeforeIndex: insertBeforeIndex)
      }

      Function("removeFromQueue") { (player, sources: [AudioSource]) in
        player.removeFromQueue(sources: sources)
      }

      Function("clearQueue") { player in
        player.clearQueue()
      }

      Function("skipToQueueIndex") { (player, index: Int) in
        player.skipToQueueIndex(index: index)
      }

      Function("skipToNext") { player in
        player.skipToNext()
      }

      Function("skipToPrevious") { player in
        player.skipToPrevious()
      }

      Function("pause") { player in
        player.ref.pause()
      }

      Function("remove") { player in
        AudioComponentRegistry.shared.remove(player)
      }

      Function("setAudioSamplingEnabled") { (player, enabled: Bool) in
        if player.samplingEnabled != enabled {
          player.setSamplingEnabled(enabled: enabled)
        }
      }

      AsyncFunction("seekTo") { (player: AudioPlayer, seconds: Double) in
        await player.ref.currentItem?.seek(
          to: CMTime(
            seconds: seconds,
            preferredTimescale: CMTimeScale(NSEC_PER_SEC)
          )
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
        AudioComponentRegistry.shared.add(recorder)

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
        recorder.prepare(options: options)
      }

      Function("record") { (recorder: AudioRecorder) -> [String: Any] in
        try checkPermissions()
        return recorder.startRecording()
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

  private func recordingDirectory() throws -> URL {
    guard let cachesDir = appContext?.fileSystem?.cachesDirectory, let directory = URL(string: cachesDir) else {
      throw Exceptions.AppContextLost()
    }
    return directory
  }

  private func setIsAudioActive(_ isActive: Bool) throws {
    if !isActive {
      for player in AudioComponentRegistry.shared.players.values {
        player.ref.pause()
      }
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
    var options: AVAudioSession.CategoryOptions = session.categoryOptions
    self.shouldPlayInBackground = mode.shouldPlayInBackground

    #if os(iOS)
    if !mode.allowsRecording {
      AudioComponentRegistry.shared.recorders.values.forEach { recorder in
        if recorder.isRecording {
          recorder.ref.stop()
          recorder.allowsRecording = false
        }
      }
    } else {
      AudioComponentRegistry.shared.recorders.values.forEach { recorder in
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
    } else {
      category = mode.allowsRecording ? .playAndRecord : .playback
      switch mode.interruptionMode {
      case .doNotMix:
        break
      case .duckOthers:
        options = [.duckOthers]
      case .mixWithOthers:
        options = [.mixWithOthers]
      }
    }

    try AVAudioSession.sharedInstance().setCategory(category, options: options)
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
