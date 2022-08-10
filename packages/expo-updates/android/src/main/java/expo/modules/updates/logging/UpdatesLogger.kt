package expo.modules.updates.logging

import android.util.Log
import java.util.*

/**
 * Class that implements logging for expo-updates with its own logcat tag
 */
class UpdatesLogger {

  fun trace(
    message: String,
    code: UpdatesErrorCode
  ) {
    trace(message, code, null, null)
  }

  fun trace(
    message: String,
    code: UpdatesErrorCode,
    updateId: String?,
    assetId: String?
  ) {
    log(message, code, UpdatesLogType.Trace, updateId, assetId)
  }

  fun debug(
    message: String,
    code: UpdatesErrorCode
  ) {
    debug(message, code, null, null)
  }

  fun debug(
    message: String,
    code: UpdatesErrorCode,
    updateId: String?,
    assetId: String?
  ) {
    log(message, code, UpdatesLogType.Debug, updateId, assetId)
  }

  fun info(
    message: String,
    code: UpdatesErrorCode
  ) {
    info(message, code, null, null)
  }

  fun info(
    message: String,
    code: UpdatesErrorCode,
    updateId: String?,
    assetId: String?
  ) {
    log(message, code, UpdatesLogType.Info, updateId, assetId)
  }

  fun warn(
    message: String,
    code: UpdatesErrorCode
  ) {
    warn(message, code, null, null)
  }

  fun warn(
    message: String,
    code: UpdatesErrorCode,
    updateId: String?,
    assetId: String?
  ) {
    log(message, code, UpdatesLogType.Warn, updateId, assetId)
  }

  fun error(
    message: String,
    code: UpdatesErrorCode
  ) {
    error(message, code, null, null)
  }

  fun error(
    message: String,
    code: UpdatesErrorCode,
    updateId: String?,
    assetId: String?
  ) {
    log(message, code, UpdatesLogType.Error, updateId, assetId)
  }

  fun fatal(
    message: String,
    code: UpdatesErrorCode
  ) {
    fatal(message, code, null, null)
  }

  fun fatal(
    message: String,
    code: UpdatesErrorCode,
    updateId: String?,
    assetId: String?
  ) {
    log(message, code, UpdatesLogType.Fatal, updateId, assetId)
  }

  private fun log(
    message: String,
    code: UpdatesErrorCode,
    level: UpdatesLogType,
    updateId: String?,
    assetId: String?
  ) {
    val timestamp = Date().time

    val stacktrace = when (level) {
      // Limit stack to 20 frames
      UpdatesLogType.Error -> Throwable().stackTrace.take(MAX_FRAMES_IN_STACKTRACE).map { f -> f.toString() }
      UpdatesLogType.Fatal -> Throwable().stackTrace.take(MAX_FRAMES_IN_STACKTRACE).map { f -> f.toString() }
      else -> {
        null
      }
    }

    val logEntry = UpdatesLogEntry(
      timestamp,
      message,
      code.code,
      level.type,
      updateId,
      assetId,
      stacktrace
    )
    when (UpdatesLogType.toOSLogType(level)) {
      Log.DEBUG -> Log.d(EXPO_UPDATES_LOGGING_TAG, logEntry.asString())
      Log.INFO -> Log.i(EXPO_UPDATES_LOGGING_TAG, logEntry.asString())
      Log.WARN -> Log.w(EXPO_UPDATES_LOGGING_TAG, logEntry.asString())
      Log.ERROR -> Log.e(EXPO_UPDATES_LOGGING_TAG, logEntry.asString())
      Log.ASSERT -> Log.e(EXPO_UPDATES_LOGGING_TAG, logEntry.asString())
    }
  }

  companion object {
    const val EXPO_UPDATES_LOGGING_TAG = "dev.expo.updates" // All logs use this tag
    const val MAX_FRAMES_IN_STACKTRACE = 20
  }
}
