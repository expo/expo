import MediaPlayer
import AVFoundation
import ExpoModulesCore

protocol LockScreenPlayable: AnyObject {
  var id: String { get }
  var isActiveForLockScreen: Bool { get set }
  var metadata: Metadata? { get set }
  var lockScreenPlayer: AVPlayer { get }
  var duration: Double { get }
  var currentTime: Double { get }
  var isPlaying: Bool { get }
  var currentRate: Float { get }
  var isLive: Bool { get }
  var supportsNextTrack: Bool { get }
  var supportsPreviousTrack: Bool { get }

  func play(at rate: Float)
  func pause()
  func nextTrack()
  func previousTrack()
}

extension LockScreenPlayable {
  var supportsNextTrack: Bool {
    false
  }

  var supportsPreviousTrack: Bool {
    false
  }

  func nextTrack() {}

  func previousTrack() {}
}

class MediaController {
  static let shared = MediaController()

  private var activePlayable: (any LockScreenPlayable)?
  private var remoteCommandCenter = MPRemoteCommandCenter.shared()
  private var nowPlayingInfoCenter = MPNowPlayingInfoCenter.default()
  private var remoteCommandTargets: [(command: MPRemoteCommand, target: Any)] = []

  private var currentArtworkUrl: URL?
  private var cachedArtwork: MPMediaItemArtwork?
  private var artworkLoadToken: UUID?
  private var currentArtworkItemIdentifier: ObjectIdentifier?
  private var isLiveStream = false

  func setActivePlayable(_ playable: (any LockScreenPlayable)?, options: LockScreenOptions? = nil) {
    performOnMain {
      self.setActivePlayableOnMain(playable, options: options)
    }
  }

  func updateNowPlayingInfo(for playable: any LockScreenPlayable) {
    performOnMain {
      self.updateNowPlayingInfoOnMain(for: playable)
    }
  }

  func refreshActivePlayable(_ playable: any LockScreenPlayable, options: LockScreenOptions?) {
    performOnMain {
      guard playable.id == self.activePlayable?.id else {
        return
      }

      self.disableRemoteCommands()
      self.clearNowPlayingInfoOnMain()
      self.setActivePlayableOnMain(playable, options: options)
    }
  }

  private func setActivePlayableOnMain(_ playable: (any LockScreenPlayable)?, options: LockScreenOptions? = nil) {
    if let previous = activePlayable, previous.id != playable?.id {
      previous.isActiveForLockScreen = false
      resetArtworkState()
      currentArtworkItemIdentifier = nil
    }

    activePlayable = playable
    playable?.isActiveForLockScreen = true
    isLiveStream = options?.isLiveStream ?? playable?.isLive ?? false

    if let playable {
      enableRemoteCommands(options: options)
      updateNowPlayingInfoOnMain(for: playable)
    } else {
      disableRemoteCommands()
      clearNowPlayingInfoOnMain()
    }
  }

  private func updateNowPlayingInfoOnMain(for playable: any LockScreenPlayable) {
    guard playable.id == activePlayable?.id else {
      return
    }

    let nextArtworkItemIdentifier = playable.lockScreenPlayer.currentItem.map { ObjectIdentifier($0) }
    if currentArtworkItemIdentifier != nextArtworkItemIdentifier {
      resetArtworkState()
      currentArtworkItemIdentifier = nextArtworkItemIdentifier
    }

    var nowPlayingInfo = nowPlayingInfoCenter.nowPlayingInfo ?? [String: Any]()

    applyPlaybackInfo(&nowPlayingInfo, for: playable)

    if let userMetadata = playable.metadata {
      applyUserMetadata(&nowPlayingInfo, from: userMetadata)
      applyArtwork(&nowPlayingInfo, from: userMetadata, for: playable, currentItemIdentifier: nextArtworkItemIdentifier)
    } else {
      resetArtworkState()
      nowPlayingInfo.removeValue(forKey: MPMediaItemPropertyArtwork)
      applyAssetMetadata(&nowPlayingInfo, for: playable)
    }

    nowPlayingInfoCenter.nowPlayingInfo = nowPlayingInfo
  }

  private func applyPlaybackInfo(_ info: inout [String: Any], for playable: any LockScreenPlayable) {
    if isLiveStream {
      info[MPNowPlayingInfoPropertyIsLiveStream] = true
      info.removeValue(forKey: MPMediaItemPropertyPlaybackDuration)
      info.removeValue(forKey: MPNowPlayingInfoPropertyElapsedPlaybackTime)
    } else {
      info[MPMediaItemPropertyPlaybackDuration] = playable.duration
      info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = playable.currentTime
    }
    info[MPNowPlayingInfoPropertyPlaybackRate] = playable.isPlaying ? playable.lockScreenPlayer.rate : 0.0
    info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.audio.rawValue
  }

  private func applyUserMetadata(_ info: inout [String: Any], from metadata: Metadata) {
    updateInfo(&info, key: MPMediaItemPropertyTitle, value: metadata.title)
    updateInfo(&info, key: MPMediaItemPropertyArtist, value: metadata.artist)
    updateInfo(&info, key: MPMediaItemPropertyAlbumTitle, value: metadata.albumTitle)
  }

  private func updateInfo(_ info: inout [String: Any], key: String, value: Any?) {
    if let value {
      info[key] = value
    } else {
      info.removeValue(forKey: key)
    }
  }

  private func applyAssetMetadata(_ info: inout [String: Any], for playable: any LockScreenPlayable) {
    guard let currentItem = playable.lockScreenPlayer.currentItem,
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

  private func applyArtwork(
    _ info: inout [String: Any],
    from metadata: Metadata,
    for playable: any LockScreenPlayable,
    currentItemIdentifier: ObjectIdentifier?
  ) {
    guard let artworkUrl = metadata.artworkUrl else {
      resetArtworkState()
      info.removeValue(forKey: MPMediaItemPropertyArtwork)
      return
    }

    if currentArtworkUrl != artworkUrl {
      currentArtworkUrl = artworkUrl
      cachedArtwork = nil
      artworkLoadToken = nil
    }

    if let cachedArtwork {
      info[MPMediaItemPropertyArtwork] = cachedArtwork
      return
    }

    guard artworkLoadToken == nil else {
      return
    }

    let loadToken = UUID()
    artworkLoadToken = loadToken

    loadArtworkFromURL(url: artworkUrl) { [weak self] artwork in
      guard let self, self.artworkLoadToken == loadToken else {
        return
      }

      self.artworkLoadToken = nil

      guard self.activePlayable?.id == playable.id,
            self.currentArtworkUrl == artworkUrl,
            self.currentArtworkItemIdentifier == currentItemIdentifier else {
        return
      }

      guard let artwork else {
        return
      }

      self.cachedArtwork = artwork

      var latestNowPlayingInfo = self.nowPlayingInfoCenter.nowPlayingInfo ?? [String: Any]()
      latestNowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
      self.nowPlayingInfoCenter.nowPlayingInfo = latestNowPlayingInfo
    }
  }

  private func clearNowPlayingInfoOnMain() {
    nowPlayingInfoCenter.nowPlayingInfo = nil
    activePlayable = nil
    isLiveStream = false
    resetArtworkState()
    currentArtworkItemIdentifier = nil
  }

  private func performOnMain(_ operation: @escaping () -> Void) {
    if Thread.isMainThread {
      operation()
    } else {
      DispatchQueue.main.async(execute: operation)
    }
  }

  private func resetArtworkState() {
    currentArtworkUrl = nil
    cachedArtwork = nil
    artworkLoadToken = nil
  }

  private func loadArtworkFromURL(url: URL, completion: @escaping (MPMediaItemArtwork?) -> Void) {
    URLSession.shared.dataTask(with: url) { data, _, error in
      if error != nil {
        self.performOnMain {
          completion(nil)
        }
        return
      }

      guard let data, let image = UIImage(data: data) else {
        self.performOnMain {
          completion(nil)
        }
        return
      }

      let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
      self.performOnMain {
        completion(artwork)
      }
    }
    .resume()
  }

  private func enableRemoteCommands(options: LockScreenOptions?) {
    removeRemoteCommandTargets()

    let playTarget = remoteCommandCenter.playCommand.addTarget { [weak self] _ in
      guard let playable = self?.activePlayable else {
        return .commandFailed
      }

      playable.play(at: Float(playable.currentRate > 0 ? playable.currentRate : 1.0))
      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.playCommand, playTarget))

    let pauseTarget = remoteCommandCenter.pauseCommand.addTarget { [weak self] _ in
      guard let playable = self?.activePlayable else {
        return .commandFailed
      }

      playable.pause()
      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.pauseCommand, pauseTarget))

    let togglePlayPauseTarget = remoteCommandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
      guard let playable = self?.activePlayable else {
        return .commandFailed
      }

      if playable.isPlaying {
        playable.pause()
      } else {
        playable.play(at: Float(playable.currentRate > 0 ? playable.currentRate : 1.0))
      }
      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.togglePlayPauseCommand, togglePlayPauseTarget))

    let changePlaybackPositionTarget = remoteCommandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard let playable = self?.activePlayable,
      let event = event as? MPChangePlaybackPositionCommandEvent else {
        return .commandFailed
      }

      let seekTime = CMTime(seconds: event.positionTime, preferredTimescale: 1)
      playable.lockScreenPlayer.seek(to: seekTime)

      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.changePlaybackPositionCommand, changePlaybackPositionTarget))

    remoteCommandCenter.skipForwardCommand.preferredIntervals = [10.0]
    let skipForwardTarget = remoteCommandCenter.skipForwardCommand.addTarget { [weak self] event in
      guard let playable = self?.activePlayable,
      let event = event as? MPSkipIntervalCommandEvent else {
        return .commandFailed
      }

      let currentTime = playable.lockScreenPlayer.currentTime()
      let seekTime = currentTime + CMTime(seconds: event.interval, preferredTimescale: 1)
      playable.lockScreenPlayer.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)

      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.skipForwardCommand, skipForwardTarget))

    remoteCommandCenter.skipBackwardCommand.preferredIntervals = [10.0]
    let skipBackwardTarget = remoteCommandCenter.skipBackwardCommand.addTarget { [weak self] event in
      guard let playable = self?.activePlayable,
      let event = event as? MPSkipIntervalCommandEvent else {
        return .commandFailed
      }

      let currentTime = playable.lockScreenPlayer.currentTime()
      let seekTime = currentTime - CMTime(seconds: event.interval, preferredTimescale: 1)
      playable.lockScreenPlayer.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)

      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.skipBackwardCommand, skipBackwardTarget))

    let nextTrackTarget = remoteCommandCenter.nextTrackCommand.addTarget { [weak self] _ in
      guard let playable = self?.activePlayable,
            playable.supportsNextTrack else {
        return .commandFailed
      }

      playable.nextTrack()
      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.nextTrackCommand, nextTrackTarget))

    let previousTrackTarget = remoteCommandCenter.previousTrackCommand.addTarget { [weak self] _ in
      guard let playable = self?.activePlayable,
            playable.supportsPreviousTrack else {
        return .commandFailed
      }

      playable.previousTrack()
      return .success
    }
    remoteCommandTargets.append((remoteCommandCenter.previousTrackCommand, previousTrackTarget))

    remoteCommandCenter.playCommand.isEnabled = true
    remoteCommandCenter.pauseCommand.isEnabled = true
    remoteCommandCenter.togglePlayPauseCommand.isEnabled = true
    remoteCommandCenter.changePlaybackPositionCommand.isEnabled = !isLiveStream
    let supportsNextTrack = activePlayable?.supportsNextTrack ?? false
    let supportsPreviousTrack = activePlayable?.supportsPreviousTrack ?? false
    let showNextTrack = (options?.showNextTrack ?? false) && supportsNextTrack
    let showPreviousTrack = (options?.showPreviousTrack ?? false) && supportsPreviousTrack

    remoteCommandCenter.skipForwardCommand.isEnabled = (options?.showSeekForward ?? false) && !showNextTrack
    remoteCommandCenter.skipBackwardCommand.isEnabled = (options?.showSeekBackward ?? false) && !showPreviousTrack
    remoteCommandCenter.nextTrackCommand.isEnabled = showNextTrack
    remoteCommandCenter.previousTrackCommand.isEnabled = showPreviousTrack
  }

  private func removeRemoteCommandTargets() {
    remoteCommandTargets.forEach { command, target in
      command.removeTarget(target)
    }
    remoteCommandTargets.removeAll()
  }

  private func disableRemoteCommands() {
    remoteCommandCenter.playCommand.isEnabled = false
    remoteCommandCenter.pauseCommand.isEnabled = false
    remoteCommandCenter.togglePlayPauseCommand.isEnabled = false
    remoteCommandCenter.changePlaybackPositionCommand.isEnabled = false
    remoteCommandCenter.skipForwardCommand.isEnabled = false
    remoteCommandCenter.skipBackwardCommand.isEnabled = false
    remoteCommandCenter.nextTrackCommand.isEnabled = false
    remoteCommandCenter.previousTrackCommand.isEnabled = false

    removeRemoteCommandTargets()
  }
}
