package expo.modules.core.logging

/**
The interface that needs to be implemented by log handlers.
 */
interface LogHandler {
  /**
   * Category is always passed in from Logger
   */
  val category: String

  /**
   * For handlers that require additional parameters
   * (e.g. Android context can be passed in here)
   */
  val additionalInfo: Any?

  fun log(type: LogType, message: String)
}
