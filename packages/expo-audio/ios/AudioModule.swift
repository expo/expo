import ExpoModulesCore
import Combine

private let recordingStatus = "onRecordingStatusUpdate"
private let playbackStatus = "onPlaybackStatusUpdate"

public class AudioModule: Module, RecordingResultHandler {
  private var timeTokens = [Int: Any?]()
  private var players = [String: AudioPlayer]()
  private var recorders = [String: AudioRecorder]()
  private var sessionIsActive = true
  private lazy var recordingDelegate = {
    RecordingDelegate(resultHandler: self)
  }()

  // MARK: Properties
  private var allowsRecording = false
  private var recordingSettings = [String: Any]()
  private var currentRate: Float = 0.0

  // MARK: Observers
  private var cancellables = Set<AnyCancellable>()
  private var endObservers = [Int: NSObjectProtocol]()

  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")

    Events(recordingStatus, playbackStatus)

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

    Class(AudioPlayer.self) {
      Constructor { (source: AudioSource?) -> AudioPlayer in
        let player = AudioPlayer(createAVPlayer(source: source))
        players[player.id] = player
        // Gets the duration of the item on load
        player.pointer.publisher(for: \.currentItem?.status).sink { [weak self] status in
          guard let self, let status else {
            return
          }
          if status == .readyToPlay {
            self.updatePlayerStatus(player: player, with: [
              "isLoaded": true
            ])
          }
        }
        .store(in: &cancellables)
        return player
      }

      // Needed to differentiate status updates when there is multiple player instances.
      Property("id") { player in
        player.sharedObjectId
      }

      Property("isBuffering") { player in
        player.isBuffering
      }

      Property("isLooping") { player in
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

      Property("isMuted") { player in
        player.pointer.isMuted
      }.set { (player, isMuted: Bool) in
        player.pointer.isMuted = isMuted
      }

      Property("shouldCorrectPitch") { player in
        player.shouldCorrectPitch
      }.set { (player, shouldCorrectPitch: Bool) in
        player.shouldCorrectPitch = shouldCorrectPitch
      }

      Property("currentPosition") { player in
        player.pointer.currentItem?.currentTime().seconds
      }

      Property("totalDuration") { player in
        player.pointer.currentItem?.duration.seconds
      }

      Property("rate") { player in
        player.pointer.rate
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
        let rate = currentRate > 0 ? currentRate : 1.0
        addPlaybackEndNotification(player: player)
        registerTimeObserver(player: player, for: player.sharedObjectId)
        player.pointer.playImmediately(atRate: rate)
      }

      Function("setRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        let playerRate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        if player.isPlaying {
          player.pointer.rate = playerRate
        }
        currentRate = playerRate
        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .varispeed
          player.pointer.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        }
      }

      Function("pause") { player in
        player.pointer.pause()
      }

      Function("release") { player in
        let id = player.sharedObjectId
        if let token = timeTokens[id] {
          player.pointer.removeTimeObserver(token)
        }
        player.pointer.pause()
        players.removeValue(forKey: player.id)
        appContext?.sharedObjectRegistry.delete(id)
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
        recorders[recorder.id] = recorder
        return recorder
      }

      Property("id") { recorder in
        recorder.sharedObjectId
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
        let id = recorder.sharedObjectId
        recorder.pointer.stop()
        recorders.removeValue(forKey: recorder.id)
        appContext?.sharedObjectRegistry.delete(id)
      }

      Function("getStatus") { recorder -> [String: Any] in
        let time = recorder.pointer.deviceCurrentTime * 1000
        let duration = recorder.pointer.currentTime

        var result: [String: Any] = [
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

  func didFinish(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    sendEvent(recordingStatus, [
      "isFinished": true,
      "hasError": false,
      "url": recorder.url
    ])
  }

  func encodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    sendEvent(recordingStatus, [
      "isFinished": true,
      "hasError": true,
      "error": error?.localizedDescription,
      "url": nil
    ])
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
      "type": desc.portType,
      "uid": desc.uid
    ]
  }

  private func setInput(_ input: String) throws {
    var prefferedInput: AVAudioSessionPortDescription?
    if let currentInputs = AVAudioSession.sharedInstance().availableInputs {
      for desc in currentInputs {
        if desc.uid == input {
          prefferedInput = desc
        }
      }
    }

    if let prefferedInput {
      try AVAudioSession.sharedInstance().setPreferredInput(prefferedInput)
    }

    throw PreferredInputFoundException(input)
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

    let preferredInput = AVAudioSession.sharedInstance().preferredInput

    if let preferredInput {
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
    let recorder = {
      if let url {
        do {
          return try AVAudioRecorder(url: url, settings: setRecordingOptions(options))
        } catch {
          return AVAudioRecorder()
        }
      }
      return AVAudioRecorder()
    }()

    recorder.delegate = recordingDelegate
    return recorder
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
    if let previous = endObservers[player.sharedObjectId] {
      NotificationCenter.default.removeObserver(previous)
    }
    endObservers[player.sharedObjectId] = NotificationCenter.default.addObserver(
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
        updatePlayerStatus(player: player, with: [
          "isPlaying": false
        ])
      }
    }
  }

  private func registerTimeObserver(player: AudioPlayer, for id: Int) {
    let interval = CMTime(seconds: 1, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeTokens[player.sharedObjectId] = player.pointer.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      self?.updatePlayerStatus(player: player, with: [
        "currentPosition": time.seconds * 1000
      ])
    }
  }

  private func updatePlayerStatus(player: AudioPlayer, with dict: [String: Any]) {
    let avPlayer = player.pointer
    var body: [String: Any] = [
      "id": player.sharedObjectId,
      "currentPosition": (avPlayer.currentItem?.currentTime().seconds ?? 0) * 1000,
      "status": statusToString(status: avPlayer.status),
      "timeControlStatus": timeControlStatusString(status: avPlayer.timeControlStatus),
      "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: avPlayer.reasonForWaitingToPlay),
      "isMuted": avPlayer.isMuted,
      "totalDuration": (avPlayer.currentItem?.duration.seconds ?? 0) * 1000,
      "isPlaying": player.pointer.timeControlStatus == .playing,
      "isLooping": player.isLooping,
      "isLoaded": avPlayer.currentItem?.status == .readyToPlay,
      "rate": avPlayer.rate,
      "shouldCorrectPitch": player.shouldCorrectPitch,
      "isBuffering": player.isBuffering
    ]

    body.merge(dict) { _, new in
      new
    }
    sendEvent(playbackStatus, body)
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
