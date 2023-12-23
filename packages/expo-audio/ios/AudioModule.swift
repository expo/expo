import ExpoModulesCore

let statusUpdate = "onPlaybackStatusUpdate"

public class AudioModule: Module {
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
    
    Function("setIsAudioActive") { (active: Bool) in
      do {
        try AVAudioSession.sharedInstance().setActive(active)
      } catch {
        throw PlayerException()
      }
    }
    
    Class(AudioPlayer.self) {
      Constructor { (source: String?) -> AudioPlayer in
        if let source, let url = URL(string: source) {
          do {
            return AudioPlayer(try AVPlayer(url: url))
          } catch {
            return AudioPlayer(AVPlayer())
          }
        }
        return AudioPlayer(AVPlayer())
      }
      
      Function("play") { (player: AudioPlayer) in
        player.pointer.play()
        player.pointer.addPeriodicTimeObserver(forInterval: CMTime(value: 1, timescale: .zero), queue: .main) { [weak self] time in
          self?.sendEvent(statusUpdate, [
            "time": time.seconds
          ])
        }
      }
      
      Function("isLoopingEnabled") { (player: AudioPlayer, enabled: Bool) in
        enabled
      }
      
      Function("pause") { (player: AudioPlayer) in
        player.pointer.pause()
      }
      
      Function("setRate") { (player, rate: Double) in
        if rate < 0 {
          player.pointer.rate = 0.0
          return
        }
        player.pointer.rate = Float(min(2.0, rate))
      }
      
      Property("isLooping") { player in
//        player.pointer.numberOfLoops < 0
        true
      }
      
      Property("isPlaying") { (player: AudioPlayer) in
        player.pointer.timeControlStatus == .playing
      }
      
      Property("isMuted") { (player: AudioPlayer) in
        player.pointer.isMuted
      }
      .set { (player, isMuted: Bool) in
        player.pointer.isMuted = isMuted
      }
      
      Property("currentTime") { (player: AudioPlayer) -> Double in
        player.pointer.currentTime().seconds
      }
      
      Property("duration") { player in
        player.pointer.currentItem?.duration.seconds
      }
      
      Property("volume") { player in
        player.pointer.volume
      }
      
      Function("seekBy") { (player: AudioPlayer, seconds: Double) in
        let newTime = player.pointer.currentTime().seconds.advanced(by: seconds)
        player.pointer.seek(to: CMTime(seconds: newTime, preferredTimescale: CMTimeScale(kCMTimeMaxTimescale)))
      }
      
      Function("setVolume") { (player: AudioPlayer, volume: Float) in
        player.pointer.volume = volume
      }
    }
  }
}
