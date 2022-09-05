package expo.modules.core.logging

import android.util.Log

/**
 * Simple log handler that forwards all logs to Android native Log class.
 */
internal class OSLogHandler(
  category: String
) : LogHandler(
  category
) {
  override fun log(type: LogType, message: String) {
    when (LogType.toOSLogType(type)) {
      Log.DEBUG -> Log.d(category, message)
      Log.INFO -> Log.i(category, message)
      Log.WARN -> Log.w(category, message)
      Log.ERROR -> Log.e(category, message)
      Log.ASSERT -> Log.e(category, message)
    }
  }
}
