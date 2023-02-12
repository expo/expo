package expo.modules.updates.logging

import android.content.Context
import expo.modules.core.logging.LogType
import expo.modules.core.logging.Logger
import expo.modules.core.logging.LoggerOptions
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
    logger.trace(logEntryString(message, code, LogType.Trace, updateId, assetId))
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
    logger.debug(logEntryString(message, code, LogType.Debug, updateId, assetId))
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
    logger.info(logEntryString(message, code, LogType.Info, updateId, assetId))
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
    logger.warn(logEntryString(message, code, LogType.Warn, updateId, assetId))
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
    logger.error(logEntryString(message, code, LogType.Error, updateId, assetId, exception))
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
    logger.fatal(logEntryString(message, code, LogType.Fatal, updateId, assetId, exception))
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
    assetId: String?,
    exception: Exception? = null
  ): String {
    val timestamp = Date().time

    val throwable = exception as? Throwable ?: Throwable()

    val stacktrace = when (level) {
      // Limit stack to 20 frames
      LogType.Error -> throwable.stackTrace.take(MAX_FRAMES_IN_STACKTRACE)
        .map { f -> f.toString() }
      LogType.Fatal -> throwable.stackTrace.take(MAX_FRAMES_IN_STACKTRACE)
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
