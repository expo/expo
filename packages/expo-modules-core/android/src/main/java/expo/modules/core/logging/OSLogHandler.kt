package expo.modules.core.logging

import android.util.Log

/**
 * Simple log handler that forwards all logs to Android native Log class.
 */
internal class OSLogHandler(
  val category: String
) : LogHandler() {
  override fun log(type: LogType, message: String, cause: Throwable?) {
    if (!isAndroid) {
      println("[${type.type}] $category\t$message")
      cause?.let {
        println("${it.localizedMessageWithCauseLocalizedMessage()}\n${cause.stackTraceToString()}")
      }
      return
    }
    when (LogType.toOSLogType(type)) {
      Log.DEBUG -> Log.d(category, message, cause)
      Log.INFO -> Log.i(category, message, cause)
      Log.WARN -> Log.w(category, message, cause)
      Log.ERROR -> Log.e(category, message, cause)
      Log.ASSERT -> Log.e(category, message, cause)
    }
  }
}

private val isAndroid = "The Android Project" == System.getProperty("java.specification.vendor")
