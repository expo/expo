package expo.modules.core.logging

import android.content.Context

object LogHandlers {
  fun createOSLogHandler(category: String): LogHandler = OSLogHandler(category)
  fun createPersistentFileLogHandler(context: Context, category: String): LogHandler = PersistentFileLogHandler(
    category,
    context
  )
}
