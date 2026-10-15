// Copyright 2026-present 650 Industries. All rights reserved.

import AVFoundation

/**
 * Decides how the shared audio session should be configured for the currently registered players.
 */
struct AudioSessionPolicy {
  struct PlayerState {
    let isPlaying: Bool
    let isMuted: Bool
    let showNowPlayingNotification: Bool
    let audioMixingMode: AudioMixingMode
  }

  let category: AVAudioSession.Category
  let mode: AVAudioSession.Mode
  let options: AVAudioSession.CategoryOptions
  let shouldActivate: Bool

  static func evaluate(
    category currentCategory: AVAudioSession.Category,
    mode currentMode: AVAudioSession.Mode,
    options currentOptions: AVAudioSession.CategoryOptions,
    players: [PlayerState]
  ) -> AudioSessionPolicy {
    let audioMixingMode = findAudioMixingMode(players: players)
    var options = currentOptions

    let isOutputtingAudio = players.contains { player in
      player.isPlaying && !player.isMuted
    }
    let anyPlayerShowsNotification = players.contains { player in
      player.showNowPlayingNotification
    }

    let shouldMixOverride = audioMixingMode == .mixWithOthers
    let doNotMixOverride = audioMixingMode == .doNotMix
    let shouldDuckOthers = audioMixingMode == .duckOthers && isOutputtingAudio

    // The app configured the session for recording (e.g. with expo-audio), which already supports video playback.
    // Switching to `.playback` would stop the microphone input, so keep the app's configuration.
    if currentCategory == .playAndRecord {
      return AudioSessionPolicy(
        category: currentCategory,
        mode: currentMode,
        options: currentOptions,
        shouldActivate: isOutputtingAudio || doNotMixOverride
      )
    }

    // The now playing notification won't be shown if we allow the audio to mix with others
    let autoShouldMix = !isOutputtingAudio && !anyPlayerShowsNotification
    let shouldMixWithOthers = shouldMixOverride || autoShouldMix

    if shouldMixWithOthers && !shouldDuckOthers && !doNotMixOverride {
      options.insert(.mixWithOthers)
    } else {
      options.remove(.mixWithOthers)
    }

    if shouldDuckOthers && !doNotMixOverride {
      options.insert(.duckOthers)
    } else {
      options.remove(.duckOthers)
    }

    return AudioSessionPolicy(
      category: .playback,
      mode: .moviePlayback,
      options: options,
      shouldActivate: isOutputtingAudio || doNotMixOverride
    )
  }

  private static func findAudioMixingMode(players: [PlayerState]) -> AudioMixingMode? {
    let playingPlayers = players.filter({ player in
      player.isPlaying
    })
    var audioMixingMode: AudioMixingMode = .mixWithOthers

    if playingPlayers.isEmpty {
      return nil
    }
    for player in playingPlayers where (audioMixingMode.priority()) < player.audioMixingMode.priority() {
      audioMixingMode = player.audioMixingMode
    }
    return audioMixingMode
  }
}
