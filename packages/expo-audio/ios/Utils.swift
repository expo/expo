import AVFoundation

func createAVPlayer(source: AudioSource?) -> AVPlayer {
  let player: AVPlayer = {
    if let source, let url = source.uri {
      do {
        return try AVPlayer(url: url)
      } catch {
        return AVPlayer()
      }
    }
    return AVPlayer()
  }()
  player.currentItem?.audioTimePitchAlgorithm = .varispeed
  
  return player
}
