package expo.modules.core.logging

/**
 * The interface that needs to be implemented by log handlers.
 */
abstract class LogHandler {
  internal abstract fun log(type: LogType, message: String, cause: Throwable? = null)
}
