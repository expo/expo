// Copyright 2026-present 650 Industries. All rights reserved.

import AVFoundation
import ExpoMediaSession

/**
 * The state of one player that decides what the player asks `expo-media-session` for.
 */
struct VideoSessionState: Equatable {
  var isPlaying = false
  var isMuted = false
  var audioMixingMode: AudioMixingMode = .auto
  var showNowPlayingNotification = false
  var manageAudioSession = true
  var hasItem = false
  var hasPlayed = false
  var isPausedForTakeover = false
  // A paused player keeps its Now Playing claim but has no session use, so it cannot ask for a session
  // that does not mix. The players that play must ask for it.
  var anotherPlayerWantsNowPlaying = false

  mutating func setPlaying(_ playing: Bool) {
    isPlaying = playing
    if playing {
      hasPlayed = hasItem
      isPausedForTakeover = false
    }
  }

  mutating func setHasItem(_ present: Bool) {
    hasItem = present
    // A new item on a player that played keeps the claim, so the lock screen shows the new item.
    hasPlayed = present && (hasPlayed || isPlaying)
  }

  var isAudible: Bool {
    return isPlaying && !isMuted
  }

  // A player that only loaded its item must not take the lock screen or activate a session that stops other apps.
  var wantsNowPlaying: Bool {
    return showNowPlayingNotification && hasPlayed
  }

  // A paused player must not keep the session active. The module activates the session of a live use again
  // when the app returns to the foreground, which would stop the audio of other apps.
  var wantsUse: Bool {
    return manageAudioSession && isPlaying && hasItem
  }

  // A player that does not manage the audio session must not change the session through the other players.
  var asksOtherPlayersNotToMix: Bool {
    return wantsNowPlaying && manageAudioSession
  }

  var mixing: MixingRequirement {
    switch audioMixingMode {
    case .mixWithOthers:
      return .mixWithOthers
    case .duckOthers:
      return isAudible ? .duckOthers : .mixWithOthers
    case .auto:
      // iOS shows the Now Playing controls only for a session that does not mix with others.
      return isAudible || wantsNowPlaying || anotherPlayerWantsNowPlaying ? .doNotMix : .mixWithOthers
    case .doNotMix:
      return .doNotMix
    }
  }

  var requirements: SessionRequirements {
    return SessionRequirements(mixing: mixing, mode: .moviePlayback)
  }
}

enum SessionUseAction: Equatable {
  case none
  case begin(SessionRequirements)
  case update(SessionRequirements)
  case end
}

func sessionUseAction(isUseLive: Bool, applied: SessionRequirements?, state: VideoSessionState) -> SessionUseAction {
  guard state.wantsUse else {
    return isUseLive ? .end : .none
  }
  let requirements = state.requirements
  if !isUseLive {
    return .begin(requirements)
  }
  return applied == requirements ? .none : .update(requirements)
}

enum NowPlayingClaimAction: Equatable {
  case none
  case offer
  case withdraw
}

func nowPlayingClaimAction(hasClaim: Bool, state: VideoSessionState) -> NowPlayingClaimAction {
  if state.wantsNowPlaying {
    return hasClaim ? .none : .offer
  }
  return hasClaim ? .withdraw : .none
}
