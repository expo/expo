import ExpoModulesCore
import Combine

public class AudioModule: Module {
  private var timeTokens = [String: Any?]()
  private var players = [String: AudioPlayer]()
  private var recorders = [String: AudioRecorder]()
  private var sessionIsActive = true

  // MARK: Properties
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
      try setAudioMode(mode: mode)
    }

    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
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
        let avPlayer = AudioUtils.createAVPlayer(source: source)
        let player = AudioPlayer(avPlayer)
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

      Property("playing") { player in
        player.playing

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
        if player.playing {
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
        guard var cachesDir = appContext?.fileSystem?.cachesDirectory, let directory = URL(string: cachesDir) else {
          throw Exceptions.AppContextLost()
        }
        let avRecorder = AudioUtils.createRecorder(directory: directory, with: options)
        let recorder = AudioRecorder(avRecorder)
        recorders[recorder.id] = recorder

        return recorder
      }

      Property("id") { recorder in
        recorder.id
      }

      Property("isRecording") { recorder in
        recorder.isRecording
      }

      Property("currentTime") { recorder in
        recorder.pointer.currentTime
      }

      Property("uri") { recorder in
        recorder.uri
      }

      Function("record") { recorder in
        try checkPermissions()
        recorder.pointer.record()
        recorder.startTimestamp = Int(recorder.deviceCurrentTime)
        recorder.getRecordingStatus()
      }

      Function("pause") { recorder in
        try checkPermissions()
        recorder.pointer.pause()
        let current = recorder.deviceCurrentTime
        recorder.previousRecordingDuration += (current - recorder.startTimestamp)
        recorder.startTimestamp = 0
      }

      Function("stop") { recorder in
        try checkPermissions()
        recorder.pointer.stop()
        recorder.startTimestamp = 0
        recorder.previousRecordingDuration = 0
      }

      Function("release") { recorder in
        recorder.pointer.stop()
        recorders.removeValue(forKey: recorder.id)
      }

      Function("getStatus") { recorder -> [String: Any] in
        recorder.getRecordingStatus()
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

  private func setAudioMode(mode: AudioMode) throws {
    try AudioUtils.validateAudioMode(mode: mode)
    var category: AVAudioSession.Category = .soloAmbient
    var options: AVAudioSession.CategoryOptions = []

    if !mode.allowsRecording {
      recorders.values.forEach { recorder in
        if recorder.isRecording {
          recorder.pointer.stop()
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
    timeTokens[player.id] = player.pointer.addPeriodicTimeObserver(forInterval: interval, queue: nil) { time in
      player.updateStatus(with: [
        "currentPosition": time.seconds * 1000
      ])
    }
  }
}
