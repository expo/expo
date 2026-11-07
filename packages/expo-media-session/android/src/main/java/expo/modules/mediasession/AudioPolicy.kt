package expo.modules.mediasession

import expo.modules.kotlin.types.Enumerable
import java.util.Objects

enum class InterruptionMode(val value: String) : Enumerable {
  MIX_WITH_OTHERS("mixWithOthers"),
  DO_NOT_MIX("doNotMix"),
  DO_NOT_MIX_PERSISTENT("doNotMixPersistent"),
  DUCK_OTHERS("duckOthers");

  val preventsMixing: Boolean
    get() = this == DO_NOT_MIX || this == DO_NOT_MIX_PERSISTENT

  val notifiesOthersOnDeactivation: Boolean
    get() = this != DO_NOT_MIX_PERSISTENT
}

enum class MixingRequirement(val value: String) : Enumerable {
  MIX_WITH_OTHERS("mixWithOthers"),
  DUCK_OTHERS("duckOthers"),
  DO_NOT_MIX("doNotMix")
}

@JvmInline
value class SessionCapability private constructor(val raw: String) {
  companion object {
    val RECORD = SessionCapability("record")
    val MEASUREMENT = SessionCapability("measurement")
  }
}

class AudioPolicy(
  val playsInSilentMode: Boolean = true,
  val interruptionMode: InterruptionMode = InterruptionMode.MIX_WITH_OTHERS,
  val allowsRecording: Boolean = false,
  val shouldPlayInBackground: Boolean = false,
  val shouldRouteThroughEarpiece: Boolean = false
) {
  fun copy(
    playsInSilentMode: Boolean = this.playsInSilentMode,
    interruptionMode: InterruptionMode = this.interruptionMode,
    allowsRecording: Boolean = this.allowsRecording,
    shouldPlayInBackground: Boolean = this.shouldPlayInBackground,
    shouldRouteThroughEarpiece: Boolean = this.shouldRouteThroughEarpiece
  ) = AudioPolicy(
    playsInSilentMode = playsInSilentMode,
    interruptionMode = interruptionMode,
    allowsRecording = allowsRecording,
    shouldPlayInBackground = shouldPlayInBackground,
    shouldRouteThroughEarpiece = shouldRouteThroughEarpiece
  )

  fun merged(update: AudioPolicyUpdate) = copy(
    playsInSilentMode = update.playsInSilentMode ?: playsInSilentMode,
    interruptionMode = update.interruptionMode ?: interruptionMode,
    allowsRecording = update.allowsRecording ?: allowsRecording,
    shouldPlayInBackground = update.shouldPlayInBackground ?: shouldPlayInBackground,
    shouldRouteThroughEarpiece = update.shouldRouteThroughEarpiece ?: shouldRouteThroughEarpiece
  )

  override fun equals(other: Any?) =
    other is AudioPolicy &&
      other.playsInSilentMode == playsInSilentMode &&
      other.interruptionMode == interruptionMode &&
      other.allowsRecording == allowsRecording &&
      other.shouldPlayInBackground == shouldPlayInBackground &&
      other.shouldRouteThroughEarpiece == shouldRouteThroughEarpiece

  override fun hashCode() =
    Objects.hash(playsInSilentMode, interruptionMode, allowsRecording, shouldPlayInBackground, shouldRouteThroughEarpiece)

  override fun toString() =
    "AudioPolicy(playsInSilentMode=$playsInSilentMode, interruptionMode=$interruptionMode, " +
      "allowsRecording=$allowsRecording, shouldPlayInBackground=$shouldPlayInBackground, " +
      "shouldRouteThroughEarpiece=$shouldRouteThroughEarpiece)"

  companion object {
    val DEFAULT = AudioPolicy()
  }
}

class AudioPolicyUpdate(
  val playsInSilentMode: Boolean? = null,
  val interruptionMode: InterruptionMode? = null,
  val allowsRecording: Boolean? = null,
  val shouldPlayInBackground: Boolean? = null,
  val shouldRouteThroughEarpiece: Boolean? = null
) {
  override fun equals(other: Any?) =
    other is AudioPolicyUpdate &&
      other.playsInSilentMode == playsInSilentMode &&
      other.interruptionMode == interruptionMode &&
      other.allowsRecording == allowsRecording &&
      other.shouldPlayInBackground == shouldPlayInBackground &&
      other.shouldRouteThroughEarpiece == shouldRouteThroughEarpiece

  override fun hashCode() =
    Objects.hash(playsInSilentMode, interruptionMode, allowsRecording, shouldPlayInBackground, shouldRouteThroughEarpiece)

  override fun toString() =
    "AudioPolicyUpdate(playsInSilentMode=$playsInSilentMode, interruptionMode=$interruptionMode, " +
      "allowsRecording=$allowsRecording, shouldPlayInBackground=$shouldPlayInBackground, " +
      "shouldRouteThroughEarpiece=$shouldRouteThroughEarpiece)"
}

class SessionRequirements(
  val mixing: MixingRequirement? = null,
  val capabilities: Set<SessionCapability> = emptySet(),
  val usage: Int? = null,
  val contentType: Int? = null,
  val pausesWhenDucked: Boolean = false
) {
  fun copy(
    mixing: MixingRequirement? = this.mixing,
    capabilities: Set<SessionCapability> = this.capabilities,
    usage: Int? = this.usage,
    contentType: Int? = this.contentType,
    pausesWhenDucked: Boolean = this.pausesWhenDucked
  ) = SessionRequirements(
    mixing = mixing,
    capabilities = capabilities,
    usage = usage,
    contentType = contentType,
    pausesWhenDucked = pausesWhenDucked
  )

  override fun equals(other: Any?) =
    other is SessionRequirements &&
      other.mixing == mixing &&
      other.capabilities == capabilities &&
      other.usage == usage &&
      other.contentType == contentType &&
      other.pausesWhenDucked == pausesWhenDucked

  override fun hashCode() = Objects.hash(mixing, capabilities, usage, contentType, pausesWhenDucked)

  override fun toString() =
    "SessionRequirements(mixing=$mixing, capabilities=$capabilities, usage=$usage, " +
      "contentType=$contentType, pausesWhenDucked=$pausesWhenDucked)"
}
