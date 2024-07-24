package expo.modules.core.logging

import android.content.Context

/**
 * Log handler that writes all logs to a file using PersistentFileLog
 * Android context must be passed in as the second parameter in the constructor
 */
internal class PersistentFileLogHandler(
  category: String,
  context: Context
) : LogHandler() {

  private val persistentFileLog = PersistentFileLog(category, context)

  override fun log(type: LogType, message: String, cause: Throwable?) {
    persistentFileLog.appendEntry(message)
    cause?.let {
      persistentFileLog.appendEntry("${cause.localizedMessage}\n${cause.stackTraceToString()}")
    }
  }
}
