package expo.modules.speech

import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.Record

enum class VoiceQuality(val value: String) : Enumerable {
  ENHANCED("Enhanced"),
  DEFAULT("Default")
}

@Record
data class VoiceRecord(
  val identifier: String,
  val name: String,
  val quality: VoiceQuality,
  val language: String
)

@Record
data class SpeechEvent(
  val id: String
)

@Record
data class SpeechRangeEvent(
  val id: String,
  val charIndex: Int,
  val charLength: Int
)
