package expo.modules.ai

import com.google.mlkit.genai.common.GenAiException
import expo.modules.kotlin.exception.CodedException
import kotlinx.coroutines.CancellationException

internal class LanguageModelException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause) {
  companion object {
    fun cancelled() = LanguageModelException("ERR_REQUEST_CANCELLED", "The language model request was cancelled.")
    fun disposed() = LanguageModelException("ERR_SESSION_DISPOSED", "The language model session has been disposed.")
    fun invalid(message: String) = LanguageModelException("ERR_INVALID_ARGUMENT", message)
    fun background() = LanguageModelException("ERR_APP_BACKGROUND", "ML Kit language model operations require the app to be in the foreground.")

    fun from(error: Throwable, fallback: String = "ERR_GENERATION_FAILED"): LanguageModelException {
      if (error is LanguageModelException) return error
      if (error is CancellationException) return cancelled()
      val code = if (error is GenAiException) {
        when (error.errorCode) {
          GenAiException.ErrorCode.CANCELLED -> "ERR_REQUEST_CANCELLED"
          GenAiException.ErrorCode.NOT_AVAILABLE,
          GenAiException.ErrorCode.NEEDS_SYSTEM_UPDATE,
          GenAiException.ErrorCode.AICORE_INCOMPATIBLE -> "ERR_MODEL_UNAVAILABLE"
          GenAiException.ErrorCode.BUSY,
          GenAiException.ErrorCode.PER_APP_BATTERY_USE_QUOTA_EXCEEDED -> "ERR_RATE_LIMITED"
          GenAiException.ErrorCode.REQUEST_TOO_LARGE -> "ERR_CONTEXT_WINDOW_EXCEEDED"
          GenAiException.ErrorCode.NOT_SUPPORTED -> "ERR_UNSUPPORTED_FEATURE"
          GenAiException.ErrorCode.BACKGROUND_USE_BLOCKED -> return background()
          GenAiException.ErrorCode.RESPONSE_PROCESSING_ERROR -> "ERR_RESPONSE_INVALID"
          else -> fallback
        }
      } else {
        fallback
      }
      return LanguageModelException(code, error.message ?: "The local language model operation failed.", error)
    }
  }
}
