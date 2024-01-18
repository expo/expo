import AVFoundation

func createAVPlayer(source: AudioSource?) -> AVPlayer {
  let player: AVPlayer = {
    if let source, let url = source.uri {
      do {
        let asset = AVURLAsset(url: url, options: source.headers)
        let item = AVPlayerItem(asset: asset)
        return try AVPlayer(playerItem: item)
      } catch {
        return AVPlayer()
      }
    }
    return AVPlayer()
  }()
  return player
}
