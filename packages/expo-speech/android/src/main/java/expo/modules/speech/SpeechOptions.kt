package expo.modules.speech

import expo.modules.core.Promise
import java.util.*

data class SpeechOptions(
  val language: String?,
  val pitch: Float?,
  val rate: Float?,
  val voice: String?
) {
  companion object {
    fun optionsFromMap(options: Map<String, Any?>?, promise: Promise): SpeechOptions? {

      if (options == null) {
        return SpeechOptions(null, null, null, null)
      }

      val language = options["language"]?.let {
        if (it is String) {
          return@let it
        }

        promise.reject("ERR_INVALID_OPTION", "Language must be a string")
        return null
      }

      val pitch = options["pitch"]?.let {
        if (it is Number) {
          return@let it.toFloat()
        }

        promise.reject("ERR_INVALID_OPTION", "Pitch must be a number")
        return null
      }

      val rate = options["rate"]?.let {
        if (it is Number) {
          return@let it.toFloat()
        }

        promise.reject("ERR_INVALID_OPTION", "Rate must be a number")
        return null
      }

      val voice = options["voice"]?.let {
        if (it is String) {
          return@let it
        }

        promise.reject("ERR_INVALID_OPTION", "Voice name must be a string")
        return null
      }

      return SpeechOptions(language, pitch, rate, voice)
    }
  }
}
