// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import MediaPlayer
import ExpoModulesCore

/**
 * A class meant to manage the "NowPlaying" widget based on currently playing players. When multiple players
 * are present the one that has most recently started playing and will be used as the source of information for the widget.
 * Paused player will be used as a data source for "NowPlaying" only if no other players are currently playing.
 */
class NowPlayingManager: VideoPlayerObserverDelegate {
  static var shared = NowPlayingManager()

  private let skipTimeInterval = 10.0
  private var timeObserver: Any?
  private weak var mostRecentInteractionPlayer: AVPlayer?
  private var players = NSHashTable<VideoPlayer>.weakObjects()
  private var artworkDataTask: URLSessionDataTask?

  private var playTarget: Any?
  private var pauseTarget: Any?
  private var skipForwardTarget: Any?
  private var skipBackwardTarget: Any?
  private var playbackPositionTarget: Any?

  init() {
    let commandCenter = MPRemoteCommandCenter.shared()

    commandCenter.skipForwardCommand.preferredIntervals = [NSNumber(value: skipTimeInterval)]
    commandCenter.skipBackwardCommand.preferredIntervals = [NSNumber(value: skipTimeInterval)]
  }

  func registerPlayer(_ player: VideoPlayer) {
    players.add(player)
    player.observer?.registerDelegate(delegate: self)

    if mostRecentInteractionPlayer == nil {
      setMostRecentInteractionPlayer(player: player.pointer)
    }
  }

  func unregisterPlayer(_ player: VideoPlayer) {
    players.remove(player)
    player.observer?.unregisterDelegate(delegate: self)

    if mostRecentInteractionPlayer == player.pointer {
      let newPlayer = players.allObjects.first(where: { $0.playbackRate != 0 })
      setMostRecentInteractionPlayer(player: newPlayer?.pointer)
    }

    if players.allObjects.isEmpty {
      let commandCenter = MPRemoteCommandCenter.shared()

      removeExistingTargets(commandCenter: commandCenter)
      MPNowPlayingInfoCenter.default().nowPlayingInfo = [:]
    }
  }

  private func setMostRecentInteractionPlayer(player: AVPlayer?) {
    if player == mostRecentInteractionPlayer {
      return
    }

    if let timeObserver {
      mostRecentInteractionPlayer?.removeTimeObserver(timeObserver)
    }
    artworkDataTask?.cancel()
    artworkDataTask = nil

    self.mostRecentInteractionPlayer = player
    self.setupNowPlayingControls()
    self.updateNowPlayingInfo()

    timeObserver = player?.addPeriodicTimeObserver(
      forInterval: CMTimeMake(value: 1, timescale: 4),
      queue: .main,
      using: { [weak self] _ in
        self?.updateNowPlayingDynamicValues()
      })
  }

  private func setupNowPlayingControls() {
    let commandCenter = MPRemoteCommandCenter.shared()

    removeExistingTargets(commandCenter: commandCenter)

    playTarget = commandCenter.playCommand.addTarget { [weak self] _ in
      guard let self, let player = self.mostRecentInteractionPlayer else {
        return .commandFailed
      }

      if player.rate == 0.0 {
        player.play()
      }
      return .success
    }

    pauseTarget = commandCenter.pauseCommand.addTarget { [weak self] _ in
      guard let self, let player = self.mostRecentInteractionPlayer else {
        return .commandFailed
      }

      for player in players.allObjects {
        player.pointer.pause()
      }
      return .success
    }

    skipBackwardTarget = commandCenter.skipBackwardCommand.addTarget { [weak self] _ in
      guard let self, let player = self.mostRecentInteractionPlayer else {
        return .commandFailed
      }
      let newTime = player.currentTime() - CMTime(seconds: skipTimeInterval, preferredTimescale: .max)
      player.seek(to: newTime)
      return .success
    }

    skipForwardTarget = commandCenter.skipForwardCommand.addTarget { [weak self] _ in
      guard let self, let player = self.mostRecentInteractionPlayer else {
        return .commandFailed
      }

      let newTime = player.currentTime() + CMTime(seconds: skipTimeInterval, preferredTimescale: .max)
      player.seek(to: newTime)
      return .success
    }

    playbackPositionTarget = commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard let self, let player = self.mostRecentInteractionPlayer else {
        return .commandFailed
      }
      if let event = event as? MPChangePlaybackPositionCommandEvent {
        player.seek(to: CMTime(seconds: event.positionTime, preferredTimescale: .max)) { _ in
          player.play()
        }
        return .success
      }
      return .commandFailed
    }
  }

  private func updateNowPlayingInfo() {
    guard let player = mostRecentInteractionPlayer, let currentItem = player.currentItem else {
      return
    }
    let videoPlayerItem = currentItem as? VideoPlayerItem

    // Metadata explicitly specified by the user
    let userMetadata = videoPlayerItem?.videoSource.metadata

    Task {
      // Metadata fetched with the video
      let assetMetadata = try? await loadMetadata(for: currentItem)

      let title = assetMetadata?.first(where: {
        $0.commonKey == .commonKeyTitle
      })

      let artist = assetMetadata?.first(where: {
        $0.commonKey == .commonKeyArtist
      })

      let artwork = assetMetadata?.first(where: {
        $0.commonKey == .commonKeyArtwork
      })

      var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]

      nowPlayingInfo[MPMediaItemPropertyTitle] = userMetadata?.title ?? title
      nowPlayingInfo[MPMediaItemPropertyArtist] = userMetadata?.artist ?? artist
      nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = currentItem.duration.seconds
      nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentItem.currentTime().seconds
      nowPlayingInfo[MPNowPlayingInfoPropertyIsLiveStream] = currentItem.duration.isIndefinite
      nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = await player.rate
      nowPlayingInfo[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.video.rawValue // Using MPNowPlayingInfoMediaType.video causes a crash
      if let artworkUrlString = userMetadata?.artwork, let url = URL(string: artworkUrlString), artworkDataTask?.originalRequest?.url != url {
        artworkDataTask?.cancel()
        artworkDataTask = fetchArtwork(url: url) { artwork in
          // We can't reuse the `nowPlayingInfo` as the actual nowPlayingInfo might've changed while the image was being fetched
          var currentNowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
          currentNowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
          MPNowPlayingInfoCenter.default().nowPlayingInfo = currentNowPlayingInfo
        }
      } else if userMetadata?.artwork == nil {
        self.artworkDataTask = nil
        nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
      }

      MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
  }

  private func loadMetadata(for mediaItem: AVPlayerItem) async throws -> [AVMetadataItem] {
    return try await mediaItem.asset.loadMetadata(for: .iTunesMetadata)
  }

  // Updates nowPlaying information that changes dynamically during playback e.g. progress
  private func updateNowPlayingDynamicValues() {
    guard let player = mostRecentInteractionPlayer, let currentItem = player.currentItem else {
      return
    }

    guard var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo else {
      return
    }

    nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = currentItem.duration.seconds
    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentItem.currentTime().seconds.rounded()
    nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player.rate
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
  }

  private func removeExistingTargets(commandCenter: MPRemoteCommandCenter) {
    commandCenter.playCommand.removeTarget(playTarget)
    commandCenter.pauseCommand.removeTarget(pauseTarget)
    commandCenter.skipForwardCommand.removeTarget(skipForwardTarget)
    commandCenter.skipBackwardCommand.removeTarget(skipBackwardTarget)
    commandCenter.changePlaybackPositionCommand.removeTarget(playbackPositionTarget)
  }

  func onItemChanged(player: AVPlayer, oldVideoPlayerItem: VideoPlayerItem?, newVideoPlayerItem: VideoPlayerItem?) {
    setupNowPlayingControls()
    updateNowPlayingInfo()
  }

  func onRateChanged(player: AVPlayer, oldRate: Float?, newRate: Float) {
    if newRate == 0 && mostRecentInteractionPlayer == player {
      if let newPlayer = players.allObjects.first(where: { $0.pointer.rate != 0 }) {
        setMostRecentInteractionPlayer(player: newPlayer.pointer)
      }
    } else if newRate != 0 && mostRecentInteractionPlayer != player {
      setMostRecentInteractionPlayer(player: player)
    }
  }

  func onPlayerItemStatusChanged(player: AVPlayer, oldStatus: AVPlayerItem.Status?, newStatus: AVPlayerItem.Status) {
    // The player can be registered before it's item has loaded. We have to re-update the notification when item data is loaded
    if player == mostRecentInteractionPlayer && newStatus == .readyToPlay {
      setupNowPlayingControls()
      updateNowPlayingInfo()
    }
  }
}

private func fetchArtwork(url: URL, completion: @escaping (MPMediaItemArtwork?) -> Void) -> URLSessionDataTask {
  let task = URLSession.shared.dataTask(with: url) { data, response, error in
    if let error = error {
      log.warn("ExpoVideo - Couldn't fetch the artwork: \(error.localizedDescription)")
      completion(nil)
      return
    }

    guard let data, response is HTTPURLResponse else {
      log.warn("ExpoVideo - Couldn't display the artwork: the response was empty")
      completion(nil)
      return
    }

    if let image = UIImage(data: data) {
      let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in
        return image
      }
      completion(artwork)
    } else {
      completion(nil)
    }
  }

  task.resume()
  return task
}
