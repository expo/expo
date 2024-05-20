import ExpoModulesCore
import Combine



public class AudioModule: Module {
  private var timeTokens = [String: Any?]()
  private var players = [String: AudioPlayer]()
  private var recorders = [String: AudioRecorder]()
  private var sessionIsActive = true

  // MARK: Properties
  private var allowsRecording = false
  private var recordingSettings = [String: Any]()


  // MARK: Observers
  private var cancellables = Set<AnyCancellable>()
  private var endObservers = [String: NSObjectProtocol]()

  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      self.appContext?.permissions?.register([
        AudioRecordingRequester()
      ])
    }

    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try validateAudioMode(mode: mode)
      var category: AVAudioSession.Category = .soloAmbient
      var options: AVAudioSession.CategoryOptions = []
      allowsRecording = mode.allowsRecording

      if !mode.allowsRecording {
        recorders.values.forEach { recorder in
          if recorder.pointer.isRecording {
            recorder.pointer.pause()
          }
        }
      }

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
          options = .duckOthers
        case .mixWithOthers:
          options = .mixWithOthers
        }
      }
      try AVAudioSession.sharedInstance().setCategory(category, options: options)
    }

    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
      if !isActive {
        for player in players.values {
          player.pointer.pause()
        }
      }

      do {
        try AVAudioSession.sharedInstance().setActive(isActive, options: [.notifyOthersOnDeactivation])
        sessionIsActive = isActive
      } catch {
        throw AudioStateException(error.localizedDescription)
      }
    }

    AsyncFunction("requestRecordingPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.askForPermission(
        usingRequesterClass: AudioRecordingRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("getRecordingPermissionsAsync") { (promise: Promise) in
      appContext?.permissions?.getPermissionUsingRequesterClass(
        AudioRecordingRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    OnDestroy {
      for observer in endObservers.values {
        NotificationCenter.default.removeObserver(observer)
      }
      players.removeAll()
      recorders.removeAll()
      timeTokens.removeAll()
      cancellables.removeAll()
    }

    // swiftlint:disable:next closure_body_length
    Class(AudioPlayer.self) {
      Constructor { (source: AudioSource?) -> AudioPlayer in
        let player = AudioPlayer(createAVPlayer(source: source))
        players[player.id] = player
        // Gets the duration of the item on load
        player.pointer
          .publisher(for: \.currentItem?.status)
          .sink { [weak self] status in
            guard let self, let status else {
              return
            }
            if status == .readyToPlay {
              player.updateStatus(with: [
                "isLoaded": true
              ])
            }
          }
          .store(in: &cancellables)
        return player
      }

      Property("id") { player in
        player.id
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

      Property("isPlaying") { player in
        player.isPlaying
      }

      Property("mute") { player in
        player.pointer.isMuted
      }.set { (player, isMuted: Bool) in
        player.pointer.isMuted = isMuted
      }

      Property("shouldCorrectPitch") { player in
        player.shouldCorrectPitch
      }.set { (player, shouldCorrectPitch: Bool) in
        player.shouldCorrectPitch = shouldCorrectPitch
      }

      Property("currentTime") { player in
        player.pointer.currentItem?.currentTime().seconds
      }

      Property("duration") { player in
        player.pointer.currentItem?.duration.seconds
      }

      Property("playbackRate") { player in
        player.pointer.rate
      }

      Property("paused") { player in
        return player.pointer.rate == 0.0
      }

      Property("volume") { player in
        player.pointer.volume
      }.set { (player, volume: Double) in
        player.pointer.volume = Float(volume)
      }

      Function("play") { player in
        guard sessionIsActive else {
          return
        }
        let rate = player.currentRate > 0 ? player.currentRate : 1.0
        addPlaybackEndNotification(player: player)
        registerTimeObserver(player: player)
        player.pointer.playImmediately(atRate: rate)
      }

      Function("setPlaybackRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        let playerRate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        if player.isPlaying {
          player.pointer.rate = playerRate
        }
        player.currentRate = playerRate
        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .varispeed
          player.pointer.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        }
      }

      Function("pause") { player in
        player.pointer.pause()
      }

      Function("release") { player in
        let id = player.id
        if let token = timeTokens[id] {
          player.pointer.removeTimeObserver(token)
        }
        player.pointer.pause()
        players.removeValue(forKey: player.id)
      }

      AsyncFunction("seekTo") { (player: AudioPlayer, seconds: Double) in
        await player.pointer.currentItem?.seek(
          to: CMTime(
            seconds: seconds / 1000,
            preferredTimescale: CMTimeScale(NSEC_PER_SEC)
          )
        )
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(AudioRecorder.self) {
      Constructor { (options: RecordingOptions) -> AudioRecorder in
        guard let cachesDir = appContext?.fileSystem?.cachesDirectory, var directory = URL(string: cachesDir) else {
          throw Exceptions.AppContextLost()
        }

        directory.appendPathComponent("Audio")
        FileSystemUtilities.ensureDirExists(at: directory)
        let fileName = "recording-\(UUID().uuidString)\(options.extension)"
        let fileUrl = directory.appendingPathComponent(fileName)

        let recorder = AudioRecorder(createRecorder(url: fileUrl, with: options))
        recorder.pointer.prepareToRecord()
        recorders[recorder.id] = recorder
        return recorder
      }

      Property("id") { recorder in
        recorder.id
      }

      Property("isRecording") { recorder in
        recorder.pointer.isRecording
      }

      Property("currentTime") { recorder in
        recorder.pointer.currentTime
      }

      Property("uri") { recorder in
        recorder.pointer.url.absoluteString
      }

      Function("record") { recorder in
        try checkPermissions()
        recorder.pointer.record()
      }

      Function("pause") { recorder in
        try checkPermissions()
        recorder.pointer.pause()
      }

      Function("stop") { recorder in
        try checkPermissions()
        recorder.pointer.stop()
      }

      Function("release") { recorder in
        recorder.pointer.stop()
        recorders.removeValue(forKey: recorder.id)
      }

      Function("getStatus") { recorder -> [String: Any] in
        let time = recorder.pointer.deviceCurrentTime * 1000
        let duration = recorder.pointer.currentTime

        var result: [String: Any] = [
          "id": recorder.id,
          "canRecord": true,
          "isRecording": recorder.pointer.isRecording,
          "durationMillis": duration,
          "mediaServicesDidReset": false
        ]

        if recorder.pointer.isMeteringEnabled {
          recorder.pointer.updateMeters()
          let currentLevel = recorder.pointer.averagePower(forChannel: 0)
          result["metering"] = currentLevel
        }

        return result
      }

      Function("startRecordingAtTime") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.pointer.record(atTime: TimeInterval(seconds))
      }

      Function("recordForDuration") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.pointer.record(forDuration: TimeInterval(seconds))
      }

      Function("getAvailableInputs") {
        getAvailableInputs()
      }

      Function("getCurrentInput") { () -> [String: Any] in
        try getCurrentInput()
      }

      Function("setInput") { (input: String) in
        try setInput(input)
      }
    }
  }

  private func getAvailableInputs() -> [[String: Any]] {
    var inputs = [[String: Any]]()
    if let availableInputs = AVAudioSession.sharedInstance().availableInputs {
      for desc in availableInputs {
        inputs.append([
          "name": desc.portName,
          "type": desc.portType,
          "uid": desc.uid
        ])
      }
    }

    return inputs
  }

  private func getCurrentInput() throws -> [String: Any] {
    guard let desc = try? getCurrentInput() else {
      throw NoInputFoundException()
    }

    return [
      "name": desc.portName,
      "type": desc.portType.rawValue,
      "uid": desc.uid
    ]
  }

  private func setInput(_ input: String) throws {
    var prefferedInput: AVAudioSessionPortDescription?
    if let currentInputs = AVAudioSession.sharedInstance().availableInputs {
      for desc in currentInputs where desc.uid == input {
        prefferedInput = desc
      }
    }

    guard let prefferedInput else {
      throw PreferredInputFoundException(input)
    }

    try AVAudioSession.sharedInstance().setPreferredInput(prefferedInput)
  }

  private func setRecordingOptions(_ options: RecordingOptions) -> [String: Any] {
    let strategy = options.bitRateStrategy?.toAVBitRateStrategy() ?? AVAudioBitRateStrategy_Variable

    var settings = [String: Any]()

    if strategy == AVAudioBitRateStrategy_Variable {
      settings[AVEncoderAudioQualityForVBRKey] = strategy
    } else {
      settings[AVEncoderAudioQualityKey] = strategy
    }
    settings[AVSampleRateKey] = options.sampleRate
    settings[AVNumberOfChannelsKey] = options.numberOfChannels
    settings[AVEncoderBitRateKey] = options.bitRate

    if let bitDepthHint = options.bitDepthHint {
      settings[AVEncoderBitDepthHintKey] = bitDepthHint
    }
    if let linearPcm = options.linearPCMBitDepth {
      settings[AVLinearPCMBitDepthKey] = linearPcm
    }
    if let linearPCMIsBigEndian = options.linearPCMIsBigEndian {
      settings[AVLinearPCMIsBigEndianKey] = linearPCMIsBigEndian
    }
    if let linearPCMIsFloat = options.linearPCMIsFloat {
      settings[AVLinearPCMIsFloatKey] = linearPCMIsFloat
    }

    if let formatKey = options.outputFormat {
      settings[AVFormatIDKey] = getFormatIDFromString(typeString: formatKey)
    }

    return settings
  }

  private func getCurrentInput() throws -> AVAudioSessionPortDescription? {
    let currentRoute = AVAudioSession.sharedInstance().currentRoute
    let inputs = currentRoute.inputs

    if !inputs.isEmpty {
      return inputs.first
    }

    if let preferredInput = AVAudioSession.sharedInstance().preferredInput {
      return preferredInput
    }

    if let availableInputs = AVAudioSession.sharedInstance().availableInputs {
      if !availableInputs.isEmpty {
        let defaultInput = availableInputs.first
        try AVAudioSession.sharedInstance().setPreferredInput(defaultInput)
        return defaultInput
      }
    }

    return nil
  }

  private func createRecorder(url: URL?, with options: RecordingOptions) -> AVAudioRecorder {
    if let url {
      do {
        return try AVAudioRecorder(url: url, settings: setRecordingOptions(options))
      } catch {
        return AVAudioRecorder()
      }
    }
    return AVAudioRecorder()
  }

  private func checkPermissions() throws {
    switch AVAudioSession.sharedInstance().recordPermission {
    case .denied, .undetermined:
      throw AudioPermissionsException()
    default:
      // Do nothing
      break
    }
  }

  private func addPlaybackEndNotification(player: AudioPlayer) {
    if let previous = endObservers[player.id] {
      NotificationCenter.default.removeObserver(previous)
    }
    endObservers[player.id] = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: player.pointer.currentItem,
      queue: nil
    ) { [weak self] _ in
      guard let self else {
        return
      }

      if player.isLooping {
        player.pointer.seek(to: CMTime.zero)
        player.pointer.play()
      } else {
        player.updateStatus(with: [
          "isPlaying": false
        ])
      }
    }
  }

  private func registerTimeObserver(player: AudioPlayer) {
    let interval = CMTime(seconds: 1, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeTokens[player.id] = player.pointer.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      player.updateStatus(with: [
        "currentPosition": time.seconds * 1000
      ])
    }
  }

  private func validateAudioMode(mode: AudioMode) throws {
    if !mode.playsInSilentMode && mode.interruptionMode == .duckOthers {
      throw InvalidAudioModeException("playsInSilentMode == false and duckOthers == true cannot be set on iOS")
    } else if !mode.playsInSilentMode && mode.allowsRecording {
      throw InvalidAudioModeException("playsInSilentMode == false and duckOthers == true cannot be set on iOS")
    } else if !mode.playsInSilentMode && mode.shouldPlayInBackground {
      throw InvalidAudioModeException("playsInSilentMode == false and staysActiveInBackground == true cannot be set on iOS.")
    }
  }
}
