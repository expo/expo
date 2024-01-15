import AVFoundation

func createAVPlayer(source: AudioSource?) -> AVPlayer {
  if let source, let url = source.uri {
    do {
      return try AVPlayer(url: url)
    } catch {
      return AVPlayer()
    }
  }
  return AVPlayer()
}
