package expo.modules.core.logging

import android.util.Log
import expo.modules.BuildConfig

/**
 * Logging class for Expo, with options to direct logs
 * to different destinations.
 */
class Logger(
  /**
   * LogHandler instances to which logs should be send
   */
  private val logHandlers: List<LogHandler>
) {
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

  /**
   * Starts a timer that can be used to compute the duration of an operation. Upon calling
   * `stop` on the returned object, a timer entry will be logged.
   */
  fun startTimer(logFormatter: (duration: Long) -> String): LoggerTimer {
    val start = System.currentTimeMillis()
    return object : LoggerTimer {
      override fun stop() {
        val end = System.currentTimeMillis()
        log(LogType.Timer, logFormatter(end - start))
      }
    }
  }

  private fun log(type: LogType, message: String, cause: Throwable? = null) {
    if (LogType.toOSLogType(type) >= minOSLevel) {
      logHandlers.forEach { handler ->
        handler.log(type, message, cause)
      }
    }
  }
}
