package expo.modules.mediasession

import android.media.AudioAttributes
import android.media.AudioManager
import java.util.Objects

class FocusSpec(
  val gain: Int,
  val usage: Int = AudioAttributes.USAGE_MEDIA,
  val contentType: Int = AudioAttributes.CONTENT_TYPE_MUSIC,
  val acceptsDelayedFocusGain: Boolean = true,
  val pausesWhenDucked: Boolean = false
) {
  fun copy(
    gain: Int = this.gain,
    usage: Int = this.usage,
    contentType: Int = this.contentType,
    acceptsDelayedFocusGain: Boolean = this.acceptsDelayedFocusGain,
    pausesWhenDucked: Boolean = this.pausesWhenDucked
  ) = FocusSpec(
    gain = gain,
    usage = usage,
    contentType = contentType,
    acceptsDelayedFocusGain = acceptsDelayedFocusGain,
    pausesWhenDucked = pausesWhenDucked
  )

  override fun equals(other: Any?) =
    other is FocusSpec &&
      other.gain == gain &&
      other.usage == usage &&
      other.contentType == contentType &&
      other.acceptsDelayedFocusGain == acceptsDelayedFocusGain &&
      other.pausesWhenDucked == pausesWhenDucked

  override fun hashCode() = Objects.hash(gain, usage, contentType, acceptsDelayedFocusGain, pausesWhenDucked)

  override fun toString() =
    "FocusSpec(gain=$gain, usage=$usage, contentType=$contentType, " +
      "acceptsDelayedFocusGain=$acceptsDelayedFocusGain, pausesWhenDucked=$pausesWhenDucked)"
}

class ResolvedSession internal constructor(
  val interruptionMode: InterruptionMode,
  val focus: FocusSpec?
) {
  override fun equals(other: Any?) =
    other is ResolvedSession && other.interruptionMode == interruptionMode && other.focus == focus

  override fun hashCode() = Objects.hash(interruptionMode, focus)

  override fun toString() = "ResolvedSession(interruptionMode=$interruptionMode, focus=$focus)"
}

object SessionResolver {
  fun resolve(policy: AudioPolicy, requirements: List<SessionRequirements>): ResolvedSession {
    val mode = requirements
      .mapNotNull { it.mixing?.interruptionMode }
      .fold(policy.interruptionMode) { strictest, candidate ->
        if (candidate.mixingRank > strictest.mixingRank) {
          candidate
        } else {
          strictest
        }
      }

    val focus = focusGain(mode)?.let { gain ->
      FocusSpec(
        gain = gain,
        usage = requirements.mapNotNull { it.usage }.maxByOrNull(::usageRank) ?: AudioAttributes.USAGE_MEDIA,
        contentType = requirements.mapNotNull { it.contentType }.maxByOrNull(::contentTypeRank)
          ?: AudioAttributes.CONTENT_TYPE_MUSIC,
        pausesWhenDucked = requirements.any { it.pausesWhenDucked }
      )
    }
    return ResolvedSession(mode, focus)
  }

  private fun focusGain(mode: InterruptionMode): Int? = when (mode) {
    InterruptionMode.DO_NOT_MIX_PERSISTENT -> AudioManager.AUDIOFOCUS_GAIN
    InterruptionMode.DO_NOT_MIX -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
    InterruptionMode.DUCK_OTHERS -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
    InterruptionMode.MIX_WITH_OTHERS -> null
  }

  private fun usageRank(usage: Int): Int = when (usage) {
    AudioAttributes.USAGE_VOICE_COMMUNICATION -> 2
    AudioAttributes.USAGE_MEDIA -> 0
    else -> 1
  }

  private fun contentTypeRank(contentType: Int): Int = when (contentType) {
    AudioAttributes.CONTENT_TYPE_SPEECH -> 3
    AudioAttributes.CONTENT_TYPE_MOVIE -> 2
    AudioAttributes.CONTENT_TYPE_MUSIC -> 1
    else -> 0
  }

  private val InterruptionMode.mixingRank: Int
    get() = when (this) {
      InterruptionMode.DO_NOT_MIX_PERSISTENT -> 3
      InterruptionMode.DO_NOT_MIX -> 2
      InterruptionMode.DUCK_OTHERS -> 1
      InterruptionMode.MIX_WITH_OTHERS -> 0
    }

  private val MixingRequirement.interruptionMode: InterruptionMode
    get() = when (this) {
      MixingRequirement.DO_NOT_MIX -> InterruptionMode.DO_NOT_MIX
      MixingRequirement.DUCK_OTHERS -> InterruptionMode.DUCK_OTHERS
      MixingRequirement.MIX_WITH_OTHERS -> InterruptionMode.MIX_WITH_OTHERS
    }
}
