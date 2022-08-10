package expo.modules.core.logging

import android.content.Context

/**
 * Log handler that writes all logs to a file using PersistentFileLog
 * Android context must be passed in as the second parameter in the constructor
 */
internal class PersistentFileLogHandler(
  override val category: String,
  override val additionalInfo: Context
) : LogHandler {

  private val persistentFileLog = PersistentFileLog(category, additionalInfo)

  override fun log(type: LogType, message: String) {
    persistentFileLog.appendEntry(message)
  }
}
