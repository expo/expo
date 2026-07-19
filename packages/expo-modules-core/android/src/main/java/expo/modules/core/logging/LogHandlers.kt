package expo.modules.core.logging

import java.io.File

object LogHandlers {
  fun createOSLogHandler(category: String): LogHandler = OSLogHandler(category)
  fun createPersistentFileLogHandler(filesDirectory: File, category: String): LogHandler = PersistentFileLogHandler(
    category,
    filesDirectory
  )
}
