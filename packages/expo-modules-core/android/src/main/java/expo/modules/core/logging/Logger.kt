package expo.modules.core.logging

import android.content.Context
import android.util.Log
import expo.modules.BuildConfig

/**
 * Native Android logging class for Expo, with options to direct logs
 * to different destinations.
 */
class Logger(
  /**
   * String that defines the tag used with the Android native logger, and
   * also used to derive the file name for logging to a file
   */
  category: String,
  /**
   * Android context is required if logging to a file
   */
  context: Context? = null,
  /**
   * One of the predefined LoggerOptions values
   */
  options: LoggerOptions
) {

  private val handlers = mutableListOf<LogHandler>().apply {
    if (options.contains(LoggerOptions.logToOS)) {
      this.add(OSLogHandler(category))
    }
    if (options.contains(LoggerOptions.logToFile)) {
      this.add(
        PersistentFileLogHandler(
          category,
          requireNotNull(context) { "You have to provide the `Context` to create a file logger" }
        )
      )
    }
  }.toList()

  private val minOSLevel = when (BuildConfig.DEBUG) {
    true -> Log.DEBUG
    else -> Log.INFO
  }

  /**
   * The most verbose log level that captures all the details about the behavior of the implementation.
   * It is mostly diagnostic and is more granular and finer than `debug` log level.
   * These logs should not be committed to the repository and are ignored in the release builds.
   */
  fun trace(message: String) {
    log(LogType.Trace, message)
  }

  /**
   * Used to log diagnostically helpful information. As opposed to `trace`,
   * it is acceptable to commit these logs to the repository. Ignored in the release builds.
   */
  fun debug(message: String) {
    log(LogType.Debug, message)
  }

  /**
   * For information that should be logged under normal conditions such as successful initialization
   * and notable events that are not considered an error but might be useful for debugging purposes
   * in the release builds.
   */
  fun info(message: String) {
    log(LogType.Info, message)
  }

  /**
   * Used to log an unwanted state that has not much impact on the process so it can be continued,
   * but could potentially become an error.
   * */
  fun warn(message: String, cause: Throwable? = null) {
    log(LogType.Warn, message, cause)
  }

  /**
   * Logs unwanted state that has an impact on the currently running process, but the entire app
   * can continue to run.
   */
  fun error(message: String, cause: Throwable? = null) {
    log(LogType.Error, message, cause)
  }

  /**
   * Logs critical error due to which the entire app cannot continue to run.
   */
  fun fatal(message: String, cause: Throwable? = null) {
    log(LogType.Fatal, message, cause)
  }

  private fun log(type: LogType, message: String, cause: Throwable? = null) {
    if (LogType.toOSLogType(type) >= minOSLevel) {
      handlers.forEach { handler ->
        handler.log(type, message, cause)
      }
    }
  }
}
