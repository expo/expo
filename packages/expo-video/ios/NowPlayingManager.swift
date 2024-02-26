// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import MediaPlayer

/**
 * A class meant to manage the "NowPlaying" widget based on currently playing players. When multiple players
 * are present the one that has most recently started playing and will be used as the source of information for the widget.
 * Paused player will be used as a data source for "NowPlaying" only if no other players are currently playing.
 */
class NowPlayingManager {
  static var shared = NowPlayingManager()

  private let skipTimeInterval = 10.0
  private var timeObserver: Any?
  private weak var mostRecentInteractionPlayer: AVPlayer?
  private var players = NSHashTable<AVPlayer>.weakObjects()
  private var observations: [AVPlayer: NSKeyValueObservation] = [:]

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

  func registerPlayer(_ player: AVPlayer) {
    if let oldObservation = observations[player] {
      oldObservation.invalidate()
    }
    observations[player] = observePlayerRate(player: player)
    players.add(player)
  }

  func unregisterPlayer(_ player: AVPlayer) {
    if let observation = observations[player] {
      observation.invalidate()
    }
    observations.removeValue(forKey: player)
    players.remove(player)
  }

  private func setMostRecentInteractionPlayer(player: AVPlayer) {
    if player == mostRecentInteractionPlayer {
      return
    }

    if let timeObserver {
      mostRecentInteractionPlayer?.removeTimeObserver(timeObserver)
    }

    self.mostRecentInteractionPlayer = player
    self.setupNowPlayingControls()

    timeObserver = player.addPeriodicTimeObserver(
      forInterval: CMTimeMake(value: 1, timescale: 4),
      queue: .main,
      using: { [weak self] _ in
        self?.updateNowPlayingInfo()
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
        player.pause()
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
    guard let player = mostRecentInteractionPlayer, let currentItem = mostRecentInteractionPlayer?.currentItem else {
      return
    }
    let metadata = currentItem.asset.commonMetadata

    let title = metadata.first(where: {
      $0.commonKey == .commonKeyTitle
    })

    let artist = metadata.first(where: {
      $0.commonKey == .commonKeyArtist
    })

    let artwork = metadata.first(where: {
      $0.commonKey == .commonKeyArtwork
    })

    var nowPlayingInfo = [String: Any]()

    nowPlayingInfo[MPMediaItemPropertyTitle] = title
    nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = currentItem.duration.seconds
    nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentItem.currentTime().seconds
    nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = player.rate
    nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork

    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
  }

  // Updates nowPlaying information that changes dynamically during playback e.g. progress
  private func updateNowPlayingDynamicValues() {
    guard let player = mostRecentInteractionPlayer, let currentItem = player.currentItem else {
      return
    }

    guard var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo else {
      return
    }

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

  private func observePlayerRate(player: AVPlayer) -> NSKeyValueObservation {
    return player.observe(\.rate) { [weak self] changedPlayer, value in
      guard let self else {
        return
      }

      let newRate = value.newValue
      if newRate == 0 && mostRecentInteractionPlayer == changedPlayer {
        if let newPlayer = players.allObjects.first(where: { $0.rate != 0 }) {
          setMostRecentInteractionPlayer(player: newPlayer)
        }
      } else if newRate != 0 && mostRecentInteractionPlayer != changedPlayer {
        setMostRecentInteractionPlayer(player: changedPlayer)
      }
    }
  }
}
