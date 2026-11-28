package expo.modules.video.mediasession

import android.media.AudioAttributes
import expo.modules.mediasession.MixingRequirement
import expo.modules.mediasession.SessionRequirements
import expo.modules.video.enums.AudioMixingMode

/**
 * The state of one player that decides what the player asks `expo-media-session` for.
 */
internal data class VideoSessionState(
  val isPlaying: Boolean = false,
  val isMuted: Boolean = false,
  val volume: Float = 1f,
  val audioMixingMode: AudioMixingMode = AudioMixingMode.AUTO,
  val showNowPlayingNotification: Boolean = false,
  val hasSource: Boolean = false,
  val isAttachedToView: Boolean = false,
  val isPausedForTakeover: Boolean = false
) {
  fun withPlaying(playing: Boolean) = copy(isPlaying = playing, isPausedForTakeover = isPausedForTakeover && !playing)

  val isAudible: Boolean
    get() = isPlaying && !isMuted && volume > 0

  val wantsUse: Boolean
    get() = isPlaying

  // The rule differs from iOS on purpose. The notification shows as soon as the source is set,
  // but only for a player that a `VideoView` displays.
  val wantsNowPlaying: Boolean
    get() = showNowPlayingNotification && hasSource && isAttachedToView

  val mixing: MixingRequirement
    get() = when (audioMixingMode) {
      AudioMixingMode.MIX_WITH_OTHERS -> MixingRequirement.MIX_WITH_OTHERS
      AudioMixingMode.DUCK_OTHERS -> if (isAudible) {
        MixingRequirement.DUCK_OTHERS
      } else {
        MixingRequirement.MIX_WITH_OTHERS
      }
      AudioMixingMode.AUTO -> if (isAudible) {
        MixingRequirement.DO_NOT_MIX
      } else {
        MixingRequirement.MIX_WITH_OTHERS
      }
      AudioMixingMode.DO_NOT_MIX -> MixingRequirement.DO_NOT_MIX
    }

  val requirements: SessionRequirements
    get() = SessionRequirements(
      mixing = mixing,
      usage = AudioAttributes.USAGE_MEDIA,
      contentType = AudioAttributes.CONTENT_TYPE_MOVIE,
      pausesWhenDucked = audioMixingMode == AudioMixingMode.DO_NOT_MIX
    )
}

internal sealed interface SessionUseAction {
  data object None : SessionUseAction

  data class Begin(val requirements: SessionRequirements) : SessionUseAction

  data class Update(val requirements: SessionRequirements) : SessionUseAction

  /** Ends the use and begins a new one. A use that lost audio focus permanently gets it back only this way. */
  data class Restart(val requirements: SessionRequirements) : SessionUseAction

  data object End : SessionUseAction
}

internal fun sessionUseAction(
  isUseLive: Boolean,
  isUseStale: Boolean,
  applied: SessionRequirements?,
  state: VideoSessionState
): SessionUseAction {
  if (!state.wantsUse) {
    return if (isUseLive) {
      SessionUseAction.End
    } else {
      SessionUseAction.None
    }
  }
  val requirements = state.requirements

  return when {
    !isUseLive -> SessionUseAction.Begin(requirements)
    // The requirements of a `doNotMix` player are the same when it is muted and when it is not.
    isUseStale && state.isAudible -> SessionUseAction.Restart(requirements)
    applied == requirements -> SessionUseAction.None
    isUseStale -> SessionUseAction.Restart(requirements)
    else -> SessionUseAction.Update(requirements)
  }
}

internal enum class NowPlayingClaimAction {
  NONE,
  OFFER,
  WITHDRAW
}

internal fun nowPlayingClaimAction(hasClaim: Boolean, state: VideoSessionState): NowPlayingClaimAction {
  if (state.wantsNowPlaying) {
    return if (hasClaim) {
      NowPlayingClaimAction.NONE
    } else {
      NowPlayingClaimAction.OFFER
    }
  }
  return if (hasClaim) {
    NowPlayingClaimAction.WITHDRAW
  } else {
    NowPlayingClaimAction.NONE
  }
}
