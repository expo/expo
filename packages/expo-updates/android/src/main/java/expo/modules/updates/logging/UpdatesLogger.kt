package expo.modules.updates.logging

import expo.modules.core.logging.LogHandlers
import expo.modules.core.logging.LogType
import expo.modules.core.logging.Logger
import expo.modules.core.logging.LoggerTimer
import expo.modules.core.logging.localizedMessageWithCauseLocalizedMessage
import expo.modules.updates.loader.AssetsFailedToLoadException
import java.io.File
import java.util.Date

interface IUpdatesLogger {
  fun startTimer(label: String): LoggerTimer
}

/**
 * Class that implements logging for expo-updates with its own logcat tag
 */
class UpdatesLogger(filesDirectory: File) : IUpdatesLogger {

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
    cause: Exception,
    code: UpdatesErrorCode = UpdatesErrorCode.None
  ) {
    error(message, cause, code, null, null)
  }

  fun error(
    message: String,
    cause: Exception,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?
  ) {
    logger.error(logEntryWithCauseExceptionString(message, cause, code, LogType.Error, null, updateId, assetId))
  }

  /**
   * Logs a failed update load as an error that starts with [context]. When assets of the update
   * failed to load, logs one error for each group of asset failures with the same code and HTTP
   * status, so that one kind of failure does not hide another.
   */
  fun errorForLoadFailure(
    context: String,
    cause: Exception,
    otherwise: UpdatesErrorCode,
    updateId: String? = null
  ) {
    val assetsFailure = generateSequence<Throwable>(cause) { it.cause }
      .filterIsInstance<AssetsFailedToLoadException>()
      .firstOrNull()
    if (assetsFailure == null) {
      error(
        "$context: ${cause.localizedMessageWithCauseLocalizedMessage()}",
        cause,
        UpdatesErrorCode.forLoadFailure(cause, otherwise),
        updateId,
        null
      )
      return
    }
    for ((code, failures) in UpdatesErrorCode.groups(assetsFailure.failures)) {
      val groupError = AssetsFailedToLoadException(failures)
      error(
        "$context: ${groupError.localizedMessageWithCauseLocalizedMessage()}",
        groupError,
        code,
        updateId,
        null
      )
    }
  }

  fun fatal(
    message: String,
    cause: Exception,
    code: UpdatesErrorCode = UpdatesErrorCode.None
  ) {
    fatal(message, cause, code, null, null)
  }

  fun fatal(
    message: String,
    exception: Exception,
    code: UpdatesErrorCode = UpdatesErrorCode.None,
    updateId: String?,
    assetId: String?
  ) {
    logger.fatal(logEntryWithCauseExceptionString(message, exception, code, LogType.Fatal, null, updateId, assetId))
  }

  override fun startTimer(label: String): LoggerTimer {
    return logger.startTimer { duration ->
      logEntryString(label, UpdatesErrorCode.None, LogType.Timer, duration, null, null)
    }
  }

  // Private methods and fields

  private val logger = Logger(
    listOf(
      LogHandlers.createOSLogHandler(EXPO_UPDATES_LOGGING_TAG),
      LogHandlers.createPersistentFileLogHandler(filesDirectory, EXPO_UPDATES_LOGGING_TAG)
    )
  )

  private fun logEntryWithCauseExceptionString(
    message: String,
    exception: Exception,
    code: UpdatesErrorCode,
    level: LogType,
    duration: Long?,
    updateId: String?,
    assetId: String?
  ): String {
    val timestamp = Date().time
    val logEntry = UpdatesLogEntry(
      timestamp,
      message,
      code.code,
      level.type,
      duration,
      updateId,
      assetId,
      stacktrace = exception.stackTrace.take(MAX_FRAMES_IN_STACKTRACE).map { f -> f.toString() }
    )

    return logEntry.asString()
  }

  private fun logEntryString(
    message: String,
    code: UpdatesErrorCode,
    level: LogType,
    duration: Long?,
    updateId: String?,
    assetId: String?
  ): String {
    val timestamp = Date().time
    val logEntry = UpdatesLogEntry(
      timestamp,
      message,
      code.code,
      level.type,
      duration,
      updateId,
      assetId,
      stacktrace = null
    )

    return logEntry.asString()
  }

  companion object {
    const val EXPO_UPDATES_LOGGING_TAG = "dev.expo.updates" // All logs use this tag
    const val MAX_FRAMES_IN_STACKTRACE = 20
  }
}
