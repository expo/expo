import MediaPlayer
import AVFoundation
import ExpoModulesCore

class MediaController {
  static let shared = MediaController()

  private var activePlayer: AudioPlayer?
  private var remoteCommandCenter = MPRemoteCommandCenter.shared()
  private var nowPlayingInfoCenter = MPNowPlayingInfoCenter.default()

  private var currentArtworkUrl: URL?
  private var cachedArtwork: MPMediaItemArtwork?

  func setActivePlayer(_ player: AudioPlayer?, options: LockScreenOptions? = nil) {
    if let previous = activePlayer, previous.id != player?.id {
      previous.isActiveForLockScreen = false
    }

    activePlayer = player
    player?.isActiveForLockScreen = true

    DispatchQueue.main.async {
      if let player {
        self.enableRemoteCommands(options: options)
        self.updateNowPlayingInfo(for: player)
      } else {
        self.disableRemoteCommands()
        self.clearNowPlayingInfo()
      }
    }
  }

  func updateNowPlayingInfo(for player: AudioPlayer) {
    guard player.id == activePlayer?.id else {
      return
    }
    var nowPlayingInfo = nowPlayingInfoCenter.nowPlayingInfo ?? [String: Any]()

    applyPlaybackInfo(&nowPlayingInfo, for: player)

    if let userMetadata = player.metadata {
      applyUserMetadata(&nowPlayingInfo, from: userMetadata)
    } else {
      applyAssetMetadata(&nowPlayingInfo, for: player)
    }

    nowPlayingInfoCenter.nowPlayingInfo = nowPlayingInfo

    if let artworkUrl = player.metadata?.artworkUrl {
      loadArtworkIfNeeded(from: artworkUrl)
    }
  }

  private func applyPlaybackInfo(_ info: inout [String: Any], for player: AudioPlayer) {
    info[MPMediaItemPropertyPlaybackDuration] = player.duration
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player.currentTime
    info[MPNowPlayingInfoPropertyPlaybackRate] = player.isPlaying ? player.ref.rate : 1.0
    info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue
  }

  private func applyUserMetadata(_ info: inout [String: Any], from metadata: Metadata) {
    if let title = metadata.title {
      info[MPMediaItemPropertyTitle] = title
    }
    if let artist = metadata.artist {
      info[MPMediaItemPropertyArtist] = artist
    }
    if let album = metadata.albumTitle {
      info[MPMediaItemPropertyAlbumTitle] = album
    }
  }

  private func applyAssetMetadata(_ info: inout [String: Any], for player: AudioPlayer) {
    guard let currentItem = player.ref.currentItem,
      let asset = currentItem.asset as? AVURLAsset else {
      return
    }

    for item in asset.commonMetadata {
      switch item.commonKey {
      case .commonKeyTitle:
        if let title = item.stringValue {
          info[MPMediaItemPropertyTitle] = title
        }
      case .commonKeyArtist:
        if let artist = item.stringValue {
          info[MPMediaItemPropertyArtist] = artist
        }
      case .commonKeyAlbumName:
        if let album = item.stringValue {
          info[MPMediaItemPropertyAlbumTitle] = album
        }
      case .commonKeyArtwork:
        if let imageData = item.dataValue,
          let image = UIImage(data: imageData) {
          info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        }
      default:
        break
      }
    }
  }

  private func loadArtworkIfNeeded(from url: URL) {
    if currentArtworkUrl == url, let cachedArtwork {
      var nowPlayingInfo = nowPlayingInfoCenter.nowPlayingInfo ?? [:]
      nowPlayingInfo[MPMediaItemPropertyArtwork] = cachedArtwork
      nowPlayingInfoCenter.nowPlayingInfo = nowPlayingInfo
      return
    }

    currentArtworkUrl = url
    loadArtworkFromURL(url: url) { [weak self] artwork in
      guard let self, let artwork else {
        return
      }
      self.cachedArtwork = artwork
      var nowPlayingInfo = self.nowPlayingInfoCenter.nowPlayingInfo ?? [:]
      nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
      self.nowPlayingInfoCenter.nowPlayingInfo = nowPlayingInfo
    }
  }

  func clearNowPlayingInfo() {
    nowPlayingInfoCenter.nowPlayingInfo = nil
    activePlayer = nil
  }

  private func loadArtworkFromURL(url: URL, completion: @escaping (MPMediaItemArtwork?) -> Void) {
    URLSession.shared.dataTask(with: url) { data, _, error in
      if error != nil {
        completion(nil)
        return
      }

      guard let data, let image = UIImage(data: data) else {
        completion(nil)
        return
      }

      let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
      DispatchQueue.main.async {
        completion(artwork)
      }
    }
    .resume()
  }

  private func enableRemoteCommands(options: LockScreenOptions?) {
    remoteCommandCenter.playCommand.addTarget { [weak self] _ in
      guard let player = self?.activePlayer else {
        return .commandFailed
      }

      player.play(at: Float(player.currentRate > 0 ? player.currentRate : 1.0))
      return .success
    }

    remoteCommandCenter.pauseCommand.addTarget { [weak self] _ in
      guard let player = self?.activePlayer else {
        return .commandFailed
      }

      player.ref.pause()
      return .success
    }

    remoteCommandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
      guard let player = self?.activePlayer else {
        return .commandFailed
      }

      if player.isPlaying {
        player.ref.pause()
      } else {
        player.play(at: Float(player.currentRate > 0 ? player.currentRate : 1.0))
      }
      return .success
    }

    remoteCommandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard let player = self?.activePlayer,
      let event = event as? MPChangePlaybackPositionCommandEvent else {
        return .commandFailed
      }

      let seekTime = CMTime(seconds: event.positionTime, preferredTimescale: 1)
      player.ref.seek(to: seekTime)

      return .success
    }

    remoteCommandCenter.skipForwardCommand.preferredIntervals = [10.0]
    remoteCommandCenter.skipForwardCommand.addTarget { [weak self] event in
      guard let player = self?.activePlayer,
      let event = event as? MPSkipIntervalCommandEvent else {
        return .commandFailed
      }

      let currentTime = player.ref.currentTime()
      let seekTime = currentTime + CMTime(seconds: event.interval, preferredTimescale: 1)
      player.ref.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)

      return .success
    }

    remoteCommandCenter.skipBackwardCommand.preferredIntervals = [10.0]
    remoteCommandCenter.skipBackwardCommand.addTarget { [weak self] event in
      guard let player = self?.activePlayer,
      let event = event as? MPSkipIntervalCommandEvent else {
        return .commandFailed
      }

      let currentTime = player.ref.currentTime()
      let seekTime = currentTime - CMTime(seconds: event.interval, preferredTimescale: 1)
      player.ref.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)

      return .success
    }

    remoteCommandCenter.playCommand.isEnabled = true
    remoteCommandCenter.pauseCommand.isEnabled = true
    remoteCommandCenter.togglePlayPauseCommand.isEnabled = true
    remoteCommandCenter.changePlaybackPositionCommand.isEnabled = true
    remoteCommandCenter.skipForwardCommand.isEnabled = options?.showSeekForward ?? false
    remoteCommandCenter.skipBackwardCommand.isEnabled = options?.showSeekBackward ?? false
  }

  private func disableRemoteCommands() {
    remoteCommandCenter.playCommand.isEnabled = false
    remoteCommandCenter.pauseCommand.isEnabled = false
    remoteCommandCenter.togglePlayPauseCommand.isEnabled = false
    remoteCommandCenter.changePlaybackPositionCommand.isEnabled = false
    remoteCommandCenter.skipForwardCommand.isEnabled = false
    remoteCommandCenter.skipBackwardCommand.isEnabled = false

    // Remove event targets
    remoteCommandCenter.playCommand.removeTarget(self)
    remoteCommandCenter.pauseCommand.removeTarget(self)
    remoteCommandCenter.togglePlayPauseCommand.removeTarget(self)
    remoteCommandCenter.changePlaybackPositionCommand.removeTarget(self)
    remoteCommandCenter.skipForwardCommand.removeTarget(self)
    remoteCommandCenter.skipBackwardCommand.removeTarget(self)
  }
}
