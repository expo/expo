package expo.modules.speech

import io.github.expo.modules.v2.Record

@Record
data class SpeechOptions(
  val language: String? = null,
  val pitch: Float? = null,
  val rate: Float? = null,
  val voice: String? = null,
  val volume: Float? = null
)
