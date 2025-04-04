package expo.modules.core.logging

import java.io.File

/**
 * Log handler that writes all logs to a file using PersistentFileLog
 * Android context must be passed in as the second parameter in the constructor
 */
internal class PersistentFileLogHandler(
  category: String,
  filesDirectory: File
) : LogHandler() {

  private val persistentFileLog = PersistentFileLog(category, filesDirectory)

  override fun log(type: LogType, message: String, cause: Throwable?) {
    persistentFileLog.appendEntry(message)
    cause?.let {
      persistentFileLog.appendEntry("${cause.localizedMessageWithCauseLocalizedMessage()}\n${cause.stackTraceToString()}")
    }
  }
}
