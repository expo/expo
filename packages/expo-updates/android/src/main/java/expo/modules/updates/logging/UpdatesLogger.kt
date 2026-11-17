package expo.modules.updates.logging

import expo.modules.core.logging.LogHandlers
import expo.modules.core.logging.LogType
import expo.modules.core.logging.Logger
import expo.modules.core.logging.LoggerTimer
import expo.modules.core.logging.localizedMessageWithCauseLocalizedMessage
import expo.modules.updatesinterface.UpdatesLogEntryListenerRegistry
import expo.modules.updatesinterface.UpdatesLogMessage
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

  /**
   * Logs a warning with the key and template of [message]. The template is filled from [values],
   * and from [cause] for its `{cause}` placeholder when [values] has no `cause`.
   */
  fun warn(
    message: UpdatesLogMessage,
    cause: Exception? = null,
    values: Map<String, String> = emptyMap(),
    updateId: String? = null,
    assetId: String? = null
  ) {
    logger.warn(logEntryString(message, cause, values, LogType.Warn, updateId, assetId))
  }

  /**
   * Logs an error with the key and template of [message], filled as for [warn]. The entry has the
   * stack trace of [cause].
   */
  fun error(
    message: UpdatesLogMessage,
    cause: Exception? = null,
    values: Map<String, String> = emptyMap(),
    updateId: String? = null,
    assetId: String? = null
  ) {
    logger.error(logEntryString(message, cause, values, LogType.Error, updateId, assetId))
  }

  /**
   * Logs a failed update load with [unreachable] when the device could not reach the server, and
   * with [failed] for any other failure. When assets of the update failed to load, [assetFailureGroups]
   * has their groups, and this logs one error for each group instead, so that one kind of failure
   * does not hide another. Those errors always have the `remote.assetsFailed` or
   * `remote.assetsUnreachable` key, whatever [failed] and [unreachable] are. A failure with a
   * [LoggedException] in its cause chain is not logged again.
   */
  fun errorForLoadFailure(
    failed: UpdatesLogMessage,
    unreachable: UpdatesLogMessage,
    cause: Exception,
    assetFailureGroups: List<AssetFailureGroup>?,
    updateId: String? = null
  ) {
    if (generateSequence<Throwable>(cause) { it.cause }.any { it is LoggedException }) {
      return
    }
    if (assetFailureGroups == null) {
      error(LoadFailures.message(cause, failed, unreachable), cause, updateId = updateId)
      return
    }
    for (group in assetFailureGroups) {
      val values = mutableMapOf(
        "count" to group.assetKeys.size.toString(),
        "assetKeys" to assetKeysValue(group.assetKeys)
      )
      if (group.httpStatus != null) {
        values["httpStatus"] = group.httpStatus.toString()
      }
      val message = LoadFailures.message(group.error, UpdatesLogMessage.RemoteAssetsFailed, UpdatesLogMessage.RemoteAssetsUnreachable)
      error(message, group.error, values, updateId)
    }
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

  private fun logEntryString(
    message: UpdatesLogMessage,
    cause: Exception?,
    values: Map<String, String>,
    level: LogType,
    updateId: String?,
    assetId: String?
  ): String {
    val filledValues = if (cause != null && !values.containsKey("cause")) {
      values + ("cause" to cause.localizedMessageWithCauseLocalizedMessage())
    } else {
      values
    }
    val stacktrace = if (level == LogType.Error || level == LogType.Fatal) {
      cause?.stackTrace?.take(MAX_FRAMES_IN_STACKTRACE)?.map { f -> f.toString() }
    } else {
      null
    }
    val logEntry = UpdatesLogEntry(
      Date().time,
      fill(message.template, filledValues),
      message.code.code,
      level.type,
      null,
      updateId,
      assetId,
      stacktrace,
      message.key,
      filledValues.ifEmpty { null }
    )
    notifyListeners(logEntry, level)
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

  private fun notifyListeners(logEntry: UpdatesLogEntry, level: LogType) {
    if (level == LogType.Warn || level == LogType.Error || level == LogType.Fatal) {
      UpdatesLogEntryListenerRegistry.notify(logEntry.asMap())
    }
  }

  companion object {
    const val EXPO_UPDATES_LOGGING_TAG = "dev.expo.updates" // All logs use this tag
    const val MAX_FRAMES_IN_STACKTRACE = 20
    private const val MAX_LISTED_ASSET_KEYS = 5
    private val PLACEHOLDER = Regex("\\{(\\w+)\\}")

    /**
     * Fills each `{name}` placeholder in [template] with `values[name]`. A placeholder with no
     * value stays as it is.
     */
    fun fill(template: String, values: Map<String, String>): String =
      PLACEHOLDER.replace(template) { match -> values[match.groupValues[1]] ?: match.value }

    private const val NO_ASSET_KEY = "(no key)"

    /**
     * The key of an asset as log values and messages show it.
     */
    fun assetKeyValue(assetKey: String?): String = assetKey ?: NO_ASSET_KEY

    /**
     * The keys of a list of assets as log values and messages show it: the first few keys, then
     * the number of keys left out.
     */
    fun assetKeysValue(assetKeys: List<String?>): String {
      val keys = assetKeys.map(::assetKeyValue)
      val listedKeys = keys.take(MAX_LISTED_ASSET_KEYS).joinToString()
      val moreKeys = if (keys.size > MAX_LISTED_ASSET_KEYS) {
        ", and ${keys.size - MAX_LISTED_ASSET_KEYS} more"
      } else {
        ""
      }
      return listedKeys + moreKeys
    }
  }
}
