import ExpoModulesCore
import Combine

private let status = "onRecordingStatusUpdate"
private let statusUpdate = "onPlaybackStatusUpdate"

public class AudioModule: Module, RecordingResultHandler {
  private var timeTokens = [Int: Any?]()
  private var players = [String: AudioPlayer]()
  private var sessionIsActive = true
  private lazy var recordingDelegate = {
    RecordingDelegate(resultHandler: self)
  }()
  
  // Observers
  private var cancellables = Set<AnyCancellable>()
  private var endObservers = [Int: NSObjectProtocol]()
  
  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")
    
    Events(statusUpdate)
    
    AsyncFunction("setCategoryAsync") { (category: AudioCategory) in
      do {
        try AVAudioSession.sharedInstance().setCategory(category.toAVCategory())
      } catch {
        throw InvalidCategoryException(category.rawValue)
      }
    }
    
    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
      for player in players.values {
        if !isActive {
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
        }.store(in: &cancellables)
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
        addPlaybackEndNotification(player: player)
        registerTimeObserver(player: player, for: player.sharedObjectId)
        player.pointer.play()
      }
      
      Function("setRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        let playerRate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        player.pointer.rate = playerRate
        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .varispeed
          player.pointer.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        }
      }
      
      Function("pause") { player in
        player.pointer.pause()
      }
      
      Function("destroy") { player in
        let id = player.sharedObjectId
        if let token = timeTokens[id] {
          player.pointer.removeTimeObserver(token)
        }
        player.pointer.pause()
        players.removeValue(forKey: player.id)
        SharedObjectRegistry.delete(id)
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
      Constructor { (url: String?) -> AudioRecorder in
        guard let cachesDir = appContext?.fileSystem?.cachesDirectory, var directory = URL(string: cachesDir) else {
          throw Exceptions.AppContextLost()
        }
        
        directory.appendPathComponent("Recording")
        FileSystemUtilities.ensureDirExists(at: directory)
        if let url {
          directory.appendingPathComponent(url)
        }
        
        return AudioRecorder(createRecorder(url: directory))
      }
      
      Property("isRecording") { recorder in
        recorder.pointer.isRecording
      }
      
      Property("currentTime") { recorder in
        recorder.pointer.currentTime
      }
        
      Function("record") { recorder in
        try checkPermissions()
        recorder.pointer.record()
      }
      
      Function("stop") { recorder in
        try checkPermissions()
        recorder.pointer.stop()
      }
      
      Function("startRecordingAtTime") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.pointer.record(atTime: TimeInterval(seconds))
      }
      
      Function("recordForDuration") { (recorder, seconds: Double) in
        try checkPermissions()
        recorder.pointer.record(forDuration: TimeInterval(seconds))
      }
    }
  }
  
  func didFinish(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    sendEvent(status, [
      "isFinished": true,
      "hasError": false,
      "url": recorder.url
    ])
  }
  
  func encodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    sendEvent(status, [
      "isFinished": true,
      "hasError": true,
      "error": error?.localizedDescription,
      "url": nil
    ])
  }
  
  private func createRecorder(url: URL?) -> AVAudioRecorder {
    let recorder = {
      if let url {
        do {
          return try AVAudioRecorder(url: url, settings: [
            AVFormatIDKey: kAudioFormatLinearPCM,
            AVSampleRateKey: 8.0,
            AVNumberOfChannelsKey: 64,
            AVAudioBitRateStrategy_Variable: AVEncoderAudioQualityKey,
          ])
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
          "isPlaying": false,
        ])
      }
    }
  }
  
  private func registerTimeObserver(player: AudioPlayer, for id: Int) {
    let interval = CMTime(seconds: 1, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeTokens[player.sharedObjectId] = player.pointer.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      self?.updatePlayerStatus(player: player, with: [
        "currentPosition": time.seconds * 1000,
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
    sendEvent(statusUpdate, body)
  }
  
  private func validateAudioMode(mode: AudioMode) throws {
    
  }
}

