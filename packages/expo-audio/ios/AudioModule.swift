import ExpoModulesCore
import Combine

let statusUpdate = "onPlaybackStatusUpdate"

public class AudioModule: Module {
  private var timeTokens = [Int: Any?]()
  private var isLooping = false
  private var cancellables = Set<AnyCancellable>()
  
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
    
    Function("setIsAudioActive") { (active: Bool?)  in
      do {
        try AVAudioSession.sharedInstance().setActive(active ?? true)
      } catch {
        throw PlayerException()
      } 
    }
    
    Class(AudioPlayer.self) {
      Constructor { (source: AudioSource?) -> AudioPlayer in
        let player = createAVPlayer(source: source)
        player.publisher(for: \.currentItem?.status).sink { [weak self] status in
          guard let self else {
            return
          }
          if let status {
            if status == .readyToPlay {
              print("ready to play")
//              sendEvent(statusUpdate, [
//                "duration": (player.currentItem?.duration.seconds ?? 0) * 1000,
//              ])
            }
          }
        }.store(in: &cancellables)
        return AudioPlayer(player)
      }
      
      Function("play") { (player: AudioPlayer) in
        NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: player.pointer.currentItem, queue: nil) { [weak self] _ in
          guard let self else {
            return
          }
          player.pointer.seek(to: CMTime.zero)
          if isLooping {
            player.pointer.play()
          }
        }
       
        player.pointer.play()
        registerTimeObserver(player: player)
      }
    
      Function("pause") { (player: AudioPlayer) in
        player.pointer.pause()
        player.pointer.removeTimeObserver(timeTokens[player.sharedObjectId])
      }
    
      Property("isLooping") {
        self.isLooping
      }.set { (isLooping: Bool) in
        self.isLooping = isLooping
      }
      
      Property("isLoaded") { player in
        player.pointer.currentItem?.status == .readyToPlay
      }
      
      Property("isPlaying") { (player: AudioPlayer) in
        return player.pointer.timeControlStatus == .playing
      }
      
      Property("isMuted") { (player: AudioPlayer) in
        player.pointer.isMuted
      }.set { (player, isMuted: Bool) in
        player.pointer.isMuted = isMuted
      }
      
      Property("currentPosition") { (player: AudioPlayer) -> Double in
        player.pointer.currentTime().seconds
      }
      
      Property("duration") { player in
        player.pointer.currentItem?.duration.seconds
      }
      
      Property("rate") { player in
        player.pointer.rate
      }.set { (player, rate: Double) in
        player.pointer.rate = rate < 0 ? 0.0 : Float(min(rate, 2.0))
      }
      
      Property("volume") { player in
        player.pointer.volume
      }.set { (player, volume: Double) in
        player.pointer.volume = Float(volume)
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

  func registerTimeObserver(player: AudioPlayer) {
    let interval = CMTime(seconds: 1, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeTokens[player.sharedObjectId] = player.pointer.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      self?.sendEvent(statusUpdate,
        [
          "currentPosition": time.seconds * 1000,
          "status": statusToString(status: player.pointer.status),
          "timeControlStatus": timeControlStatusString(status: player.pointer.timeControlStatus),
          "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: player.pointer.reasonForWaitingToPlay),
          "isMuted": player.pointer.isMuted,
          "duration": (player.pointer.currentItem?.duration.seconds ?? 0) * 1000,
          "isPlaying": player.pointer.timeControlStatus == .playing,
        ]
      )
    }
  }

  private func createAVPlayer(source: AudioSource?) -> AVPlayer {
    if let source, let url = source.uri {
      do {
        return try AVPlayer(url: url)
      } catch {
        return AVPlayer()
      }
    }
    return AVPlayer()
  }
  
  func test() {
    print("test")
  }
}



func statusToString(status: AVPlayer.Status) -> String {
  switch status {
  case .readyToPlay:
    return "readyToPlay"
  case .failed:
    return "failed"
  case .unknown:
    return "unknown"
  }
}

func timeControlStatusString(status: AVPlayer.TimeControlStatus) -> String {
  switch status {
  case .playing:
    return "playing"
  case .paused:
    return "paused"
  case .waitingToPlayAtSpecifiedRate:
    return "waitingToPlayAtSpecifiedRate"
  }
}

func reasonForWaitingToPlayString(status: AVPlayer.WaitingReason?) -> String {
  guard let status else {
    return "unknown"
  }
  
  switch status {
  case .evaluatingBufferingRate:
    return "evaluatingBufferingRate"
  case .noItemToPlay:
    return "noItemToPlay"
  case .toMinimizeStalls:
    return "toMinimizeStalls"
  default:
    return "unknown"
  }
}
