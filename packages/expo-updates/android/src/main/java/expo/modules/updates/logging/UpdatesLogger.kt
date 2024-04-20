package expo.modules.updates.logging

import android.content.Context
import expo.modules.core.logging.LogHandlers
import expo.modules.core.logging.LogType
import expo.modules.core.logging.Logger
import expo.modules.core.logging.LoggerTimer
import java.util.Date

/**
 * Class that implements logging for expo-updates with its own logcat tag
 */
class UpdatesLogger(context: Context) {

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
    logger.trace(logEntryString(message, code, LogType.Trace, null, updateId, assetId))
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
    logger.debug(logEntryString(message, code, LogType.Debug, null, updateId, assetId))
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
    logger.info(logEntryString(message, code, LogType.Info, null, updateId, assetId))
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
    logger.warn(logEntryString(message, code, LogType.Warn, null, updateId, assetId))
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
    logger.error(logEntryString(message, code, LogType.Error, null, updateId, assetId, exception))
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
    logger.fatal(logEntryString(message, code, LogType.Fatal, null, updateId, assetId, exception))
  }

  fun startTimer(label: String): LoggerTimer {
    return logger.startTimer { duration ->
      logEntryString(label, UpdatesErrorCode.None, LogType.Timer, duration, null, null, null)
    }
  }

  // Private methods and fields

  private val logger = Logger(
    listOf(
      LogHandlers.createOSLogHandler(EXPO_UPDATES_LOGGING_TAG),
      LogHandlers.createPersistentFileLogHandler(context, EXPO_UPDATES_LOGGING_TAG)
    )
  )

  private fun logEntryString(
    message: String,
    code: UpdatesErrorCode,
    level: LogType,
    duration: Long?,
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
      duration,
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
