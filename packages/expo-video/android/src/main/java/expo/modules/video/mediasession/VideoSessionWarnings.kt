package expo.modules.video.mediasession

import expo.modules.video.enums.AudioMixingMode

internal enum class VideoSessionConflict(val message: String) {
  AUDIO_MIXING_MODE_IGNORED(
    "[expo-video] `audioMixingMode` has no effect, because `manageAudioSession` is `false`. " +
      "Set the mixing behavior with `setAudioPolicyAsync()` from `expo-media-session`, or set `manageAudioSession` to `true`."
  )
}

/**
 * The settings of a player that cannot work with the audio focus that the app manages.
 * A player with `manageAudioSession` set to `false` reports them and does not request audio focus.
 */
internal fun sessionConflicts(state: VideoSessionState): List<VideoSessionConflict> {
  if (state.manageAudioSession || state.audioMixingMode == AudioMixingMode.AUTO) {
    return emptyList()
  }
  return listOf(VideoSessionConflict.AUDIO_MIXING_MODE_IGNORED)
}

internal const val SESSION_MANAGEMENT_MIX_WARNING =
  "[expo-video] Players with `manageAudioSession` set to `true` and to `false` are in use at the same time. " +
    "A player that manages the audio session can change the session settings of the app, for example the mixing mode. " +
    "Set `manageAudioSession` to the same value on all players."

/**
 * Finds when a player that manages audio focus is in use together with a player that does not.
 * A player that manages audio focus counts only while it wants a session use or the Now Playing notification,
 * because each player manages audio focus until the app sets `manageAudioSession`.
 * The class is not thread-safe.
 */
internal class SessionManagementMix<ID> {
  private val manual = mutableSetOf<ID>()
  private val managed = mutableSetOf<ID>()
  private var isReported = false

  /**
   * Records the state of one player.
   * Returns `true` one time when the mix begins. It can return `true` again only after all the players
   * that do not manage audio focus are released or manage it again.
   */
  fun shouldWarnAfterUpdating(id: ID, state: VideoSessionState): Boolean {
    remove(id)

    if (!state.manageAudioSession) {
      manual.add(id)
    } else if (state.wantsUse || state.wantsNowPlaying) {
      managed.add(id)
    }
    if (manual.isEmpty() || managed.isEmpty() || isReported) {
      return false
    }
    isReported = true
    return true
  }

  fun remove(id: ID) {
    manual.remove(id)
    managed.remove(id)

    if (manual.isEmpty()) {
      isReported = false
    }
  }
}
