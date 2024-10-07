import ExpoModulesCore

public class AudioModule: Module {
  private var sessionIsActive = true

  // MARK: Properties
  private var recordingSettings = [String: Any]()

  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      self.appContext?.permissions?.register([
        AudioRecordingRequester()
      ])
    }

    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try setAudioMode(mode: mode)
    }

    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool) in
      try setIsAudioActive(isActive)
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
      AudioComponentRegistry.shared.removeAll()
    }

    // swiftlint:disable:next closure_body_length
    Class(AudioPlayer.self) {
      Constructor {
        (source: AudioSource?, updateInterval: Double, enableLockScreenControls: Bool)
          -> AudioPlayer in
        let avPlayer = AudioUtils.createAVPlayer(source: source)
        let player = AudioPlayer(
          avPlayer, interval: updateInterval, enableLockScreenControls: enableLockScreenControls)
        AudioComponentRegistry.shared.add(player)
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
        player.playing
      }

      Property("mute") { player in
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
        player.ref.currentItem?.currentTime().seconds
      }

      Property("duration") { player in
        if player.ref.status == .readyToPlay {
          (player.ref.currentItem?.duration.seconds ?? 0.0) * 1000
        } else {
          0.0
        }
      }

      Property("playbackRate") { player in
        player.ref.rate
      }

      Property("paused") { player in
        return player.ref.rate == 0.0
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

      Function("setPlaybackRate") {
        (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        let playerRate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        if player.playing {
          player.ref.rate = playerRate
        }
        player.currentRate = playerRate
        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .varispeed
          player.ref.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        }
      }

      Function("pause") { player in
        player.ref.pause()
      }

      Function("remove") { player in
        AudioComponentRegistry.shared.remove(player)
      }

      Function("setAudioSamplingEnabled") { (player, enabled: Bool) in
        player.setSamplingEnabled(enabled: enabled)
      }

      AsyncFunction("seekTo") { (player: AudioPlayer, seconds: Double) in
        await player.ref.currentItem?.seek(
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
        guard let cachesDir = appContext?.fileSystem?.cachesDirectory,
          let directory = URL(string: cachesDir)
        else {
          throw Exceptions.AppContextLost()
        }
        let avRecorder = AudioUtils.createRecorder(directory: directory, with: options)
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

      Function("record") { (recorder: AudioRecorder) -> [String: Any] in
        try checkPermissions()
        recorder.ref.record()
        recorder.startTimestamp = Int(recorder.deviceCurrentTime)
        return recorder.getRecordingStatus()
      }

      Function("pause") { recorder in
        try checkPermissions()
        recorder.ref.pause()
        let current = recorder.deviceCurrentTime
        recorder.previousRecordingDuration += (current - recorder.startTimestamp)
        recorder.startTimestamp = 0
      }

      Function("stop") { recorder in
        try checkPermissions()
        recorder.ref.stop()
        recorder.startTimestamp = 0
        recorder.previousRecordingDuration = 0
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
  }

  private func setIsAudioActive(_ isActive: Bool) throws {
    if !isActive {
      for player in AudioComponentRegistry.shared.players.values {
        player.ref.pause()
      }
    }

    do {
      try AVAudioSession.sharedInstance().setActive(
        isActive, options: [.notifyOthersOnDeactivation])
      sessionIsActive = isActive
    } catch {
      throw AudioStateException(error.localizedDescription)
    }
  }

  private func setAudioMode(mode: AudioMode) throws {
    try AudioUtils.validateAudioMode(mode: mode)
    var category: AVAudioSession.Category = .soloAmbient
    var options: AVAudioSession.CategoryOptions = []

    if !mode.allowsRecording {
      AudioComponentRegistry.shared.recorders.values.forEach { recorder in
        if recorder.isRecording {
          recorder.ref.stop()
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

  private func checkPermissions() throws {
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
  }
}
