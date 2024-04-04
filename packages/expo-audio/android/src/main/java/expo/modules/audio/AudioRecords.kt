package expo.modules.audio

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

class AudioSource(
  @Field val uri: String? = null
) : Record

class AudioMode(
  @Field val playsInSilentMode: Boolean = false,
  @Field val interruptionMode: InterruptionMode = InterruptionMode.MIX_WITH_OTHERS,
  @Field val allowsRecording: Boolean = true,
  @Field val shouldPlayInBackground: Boolean = true
) : Record

enum class InterruptionMode(val value: String) : Enumerable {
  MIX_WITH_OTHERS("mixWithOthers"),
  DO_NOT_MIX("doNotMix"),
  DUCK_OTHERS("duckOthers")
}