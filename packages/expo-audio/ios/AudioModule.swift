import ExpoModulesCore
import Combine

private let statusUpdate = "onPlaybackStatusUpdate"

public class AudioModule: Module {
  private var timeTokens = [Int: Any?]()
  private var isLooping = false
  private var shouldCorrectPitch = false
  
  // Observers
  private var cancellables = Set<AnyCancellable>()
  private var endObservers = [Int: NSObjectProtocol]()
  
  public func definition() -> ModuleDefinition {
    Name("ExpoAudio")
    
    Events(statusUpdate)
    
    Function("setCategory") { (category: AudioCategory) in
      do {
        try AVAudioSession.sharedInstance().setCategory(category.toAVCategory())
      } catch {
        throw InvalidCategoryException(category.rawValue)
      }
    }
    
    Function("setIsAudioActive") { (active: Bool)  in
      do {
        try AVAudioSession.sharedInstance().setActive(active)
      } catch {
        throw PlayerException()
      }
    }
    
    OnDestroy {
      for observer in endObservers.values {
        NotificationCenter.default.removeObserver(observer)
      }
      cancellables.removeAll()
    }
    
    Class(AudioPlayer.self) {
      Constructor { (source: AudioSource?) -> AudioPlayer in
        let player = AudioPlayer(createAVPlayer(source: source))
        
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
      
      Property("isLooping") {
        self.isLooping
      }.set { (isLooping: Bool) in
        self.isLooping = isLooping
      }
      
      Property("isLoaded") { player in
        player.pointer.currentItem?.status == .readyToPlay
      }
      
      Property("isPlaying") { player in
        return player.pointer.timeControlStatus == .playing
      }
      
      Property("isMuted") { player in
        player.pointer.isMuted
      }.set { (player, isMuted: Bool) in
        player.pointer.isMuted = isMuted
      }
      
      Property("shouldCorrectPitch") {
        self.shouldCorrectPitch
      }.set { shouldCorrectPitch in
        self.shouldCorrectPitch = shouldCorrectPitch
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
        addPlaybackEndNotification(player: player)
        player.pointer.play()
        player.pointer.currentItem?.audioTimePitchAlgorithm = .timeDomain
        registerTimeObserver(player: player, for: player.sharedObjectId)
      }
      
      Function("setRate") { (player, rate: Double, pitchCorrectionQuality: PitchCorrectionQuality?) in
        player.pointer.rate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
        if shouldCorrectPitch {
          player.pointer.currentItem?.audioTimePitchAlgorithm = pitchCorrectionQuality?.toPitchAlgorithm() ?? PitchCorrectionQuality.medium.toPitchAlgorithm()
        }
      }
      
      Function("pause") { player in
        player.pointer.pause()
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
      
      if isLooping {
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
      "isLooping": isLooping,
      "isLoaded": avPlayer.currentItem?.status == .readyToPlay,
      "rate": avPlayer.rate,
      "shouldCorrectPitch": shouldCorrectPitch
    ]
    
    body.merge(dict) { _, new in
      new
    }
    sendEvent(statusUpdate, body)
  }
}

