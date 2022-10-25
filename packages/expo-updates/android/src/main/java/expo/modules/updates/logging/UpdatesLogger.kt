package expo.modules.updates.logging

import android.content.Context
import java.lang.Exception
import java.util.*

/**
 * Class that implements logging for expo-updates with its own logcat tag
 */
class UpdatesLogger(
  context: Context
) {

  fun trace(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None
  ) {
    trace(message, code, null, null)
  }

  fun trace(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?
  ) {
  }

  fun debug(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None
  ) {
    debug(message, code, null, null)
  }

  fun debug(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?
  ) {
  }

  fun info(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None
  ) {
    info(message, code, null, null)
  }

  fun info(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?
  ) {
  }

  fun warn(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None
  ) {
    warn(message, code, null, null)
  }

  fun warn(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?
  ) {
  }

  fun error(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    exception: Exception? = null
  ) {
    error(message, code, null, null, exception)
  }

  fun error(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?,
    exception: Exception? = null
  ) {
  }

  fun fatal(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    exception: Exception? = null
  ) {
    fatal(message, code, null, null, exception)
  }

  fun fatal(
    message: String,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?,
    exception: Exception? = null
  ) {
  }

  companion object {
    const val EXPO_UPDATES_LOGGING_TAG = "dev.expo.updates" // All logs use this tag
    const val MAX_FRAMES_IN_STACKTRACE = 20
  }
}
