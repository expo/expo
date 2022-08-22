package expo.modules.updates.logging

import android.content.Context
import expo.modules.core.logging.LogType
import expo.modules.core.logging.Logger
import expo.modules.core.logging.LoggerOptions
import java.util.*

/**
 * Class that implements logging for expo-updates with its own logcat tag
 */
class UpdatesLogger(
  context: Context
) {

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
    logger.trace(logEntryString(message, code, LogType.Trace, updateId, assetId))
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
    logger.debug(logEntryString(message, code, LogType.Debug, updateId, assetId))
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
    logger.info(logEntryString(message, code, LogType.Info, updateId, assetId))
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
    logger.warn(logEntryString(message, code, LogType.Warn, updateId, assetId))
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
    logger.error(logEntryString(message, code, LogType.Error, updateId, assetId))
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
    logger.fatal(logEntryString(message, code, LogType.Fatal, updateId, assetId))
  }

  // Private methods and fields

  private val logger = Logger(
    EXPO_UPDATES_LOGGING_TAG,
    context,
    LoggerOptions.union(listOf(LoggerOptions.logToOS, LoggerOptions.logToFile))
  )

  private fun logEntryString(
    message: String,
    code: UpdatesErrorCode,
    level: LogType,
    updateId: String?,
    assetId: String?
  ): String {
    val timestamp = Date().time

    val stacktrace = when (level) {
      // Limit stack to 20 frames
      LogType.Error -> Throwable().stackTrace.take(MAX_FRAMES_IN_STACKTRACE)
        .map { f -> f.toString() }
      LogType.Fatal -> Throwable().stackTrace.take(MAX_FRAMES_IN_STACKTRACE)
        .map { f -> f.toString() }
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

    return logEntry.asString()
  }

  companion object {
    const val EXPO_UPDATES_LOGGING_TAG = "dev.expo.updates" // All logs use this tag
    const val MAX_FRAMES_IN_STACKTRACE = 20
  }
}
