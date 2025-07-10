package expo.modules.speech

import android.speech.tts.TextToSpeech
import expo.modules.kotlin.exception.CodedException

class SpeechInputIsToLongException : CodedException(
  message = "Speech input text is too long! Limit of input length is: ${TextToSpeech.getMaxSpeechInputLength()}"
)

class SpeechUnableToGetVoicesException(cause: Throwable? = null) : CodedException(
  message = "Unable to get voices. Please check if TTS is initialized correctly.",
  cause
)
