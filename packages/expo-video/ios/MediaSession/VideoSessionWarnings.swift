// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoMediaSession

enum VideoSessionConflict: Equatable {
  case nowPlayingWithMixingSession
  case audioMixingModeIgnored

  var message: String {
    switch self {
    case .nowPlayingWithMixingSession:
      return "[expo-video] The Now Playing controls will not show, because `manageAudioSession` is `false` and the audio session mixes with other apps. "
        + "iOS shows the controls only for an active session that does not mix. "
        + "Call `setAudioPolicyAsync({ interruptionMode: 'doNotMix' })` and `holdSession()` from `expo-media-session`, or set `manageAudioSession` to `true`."
    case .audioMixingModeIgnored:
      return "[expo-video] `audioMixingMode` has no effect, because `manageAudioSession` is `false`. "
        + "Set the mixing behavior with `setAudioPolicyAsync()` from `expo-media-session`, or set `manageAudioSession` to `true`."
    }
  }
}

/**
 * The settings of a player that cannot work with the session that the app manages.
 * A player with `manageAudioSession` set to `false` reports them and does not change the session.
 */
func sessionConflicts(state: VideoSessionState, policyMode: InterruptionMode) -> [VideoSessionConflict] {
  guard !state.manageAudioSession else {
    return []
  }
  var conflicts: [VideoSessionConflict] = []

  if state.wantsNowPlaying && !policyMode.preventsMixing {
    conflicts.append(.nowPlayingWithMixingSession)
  }
  if state.audioMixingMode != .auto {
    conflicts.append(.audioMixingModeIgnored)
  }
  return conflicts
}

let sessionManagementMixWarning = "[expo-video] Players with `manageAudioSession` set to `true` and to `false` are in use at the same time. "
  + "A player that manages the audio session can change the session settings of the app, for example the mixing mode. "
  + "Set `manageAudioSession` to the same value on all players."

/**
 * Finds when a player that manages the audio session is in use together with a player that does not.
 * A player that manages the session counts only while it wants a session use or the Now Playing controls,
 * because each player manages the session until the app sets `manageAudioSession`.
 */
struct SessionManagementMix<ID: Hashable> {
  private var manual: Set<ID> = []
  private var managed: Set<ID> = []
  private var isReported = false

  /**
   * Records the state of one player.
   * Returns `true` one time when the mix begins. It can return `true` again only after all the players
   * that do not manage the session are released or manage it again.
   */
  mutating func shouldWarn(afterUpdating id: ID, to state: VideoSessionState) -> Bool {
    remove(id)

    if !state.manageAudioSession {
      manual.insert(id)
    } else if state.wantsUse || state.wantsNowPlaying {
      managed.insert(id)
    }
    if manual.isEmpty || managed.isEmpty || isReported {
      return false
    }
    isReported = true
    return true
  }

  mutating func remove(_ id: ID) {
    manual.remove(id)
    managed.remove(id)

    if manual.isEmpty {
      isReported = false
    }
  }
}
