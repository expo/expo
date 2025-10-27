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

    nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = player.duration
    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player.currentTime
    nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player.isPlaying ? player.ref.rate : 1.0
    nowPlayingInfo[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue

    if let userMetadata = player.metadata {
      if let title = userMetadata.title {
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
      }
      if let artist = userMetadata.artist {
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist
      }
      if let album = userMetadata.albumTitle {
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
      }
      if let artworkUrl = userMetadata.artworkUrl {
        if currentArtworkUrl != artworkUrl {
          currentArtworkUrl = artworkUrl
        } else {
          if let cachedArtwork {
            nowPlayingInfo[MPMediaItemPropertyArtwork] = cachedArtwork
            self.nowPlayingInfoCenter.nowPlayingInfo = nowPlayingInfo
          }
        }
        loadArtworkFromURL(url: artworkUrl) { [weak self] artwork in
          if let artwork {
            self?.cachedArtwork = artwork
            nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
            self?.nowPlayingInfoCenter.nowPlayingInfo = nowPlayingInfo
          }
        }
      }
    } else {
      // Try to get the metadata from the provided asset
      if let currentItem = player.ref.currentItem,
      let asset = currentItem.asset as? AVURLAsset {
        let metadata = asset.commonMetadata

        for item in metadata {
          switch item.commonKey {
          case .commonKeyTitle:
            if let title = item.stringValue {
              nowPlayingInfo[MPMediaItemPropertyTitle] = title
            }
          case .commonKeyArtist:
            if let artist = item.stringValue {
              nowPlayingInfo[MPMediaItemPropertyArtist] = artist
            }
          case .commonKeyAlbumName:
            if let album = item.stringValue {
              nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album
            }
          case .commonKeyArtwork:
            if let imageData = item.dataValue,
              let image = UIImage(data: imageData) {
              let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
              nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
            }
          default:
            break
          }
        }
      }
    }
    nowPlayingInfoCenter.nowPlayingInfo = nowPlayingInfo
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
    remoteCommandCenter.playCommand.removeTarget(self);
    remoteCommandCenter.pauseCommand.removeTarget(self);
    remoteCommandCenter.togglePlayPauseCommand.removeTarget(self);
    remoteCommandCenter.changePlaybackPositionCommand.removeTarget(self);
    remoteCommandCenter.skipForwardCommand.removeTarget(self);
    remoteCommandCenter.skipBackwardCommand.removeTarget(self);
  }
}
