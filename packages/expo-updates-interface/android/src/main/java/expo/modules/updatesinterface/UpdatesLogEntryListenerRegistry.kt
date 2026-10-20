package expo.modules.updatesinterface

import android.util.Log
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Receives expo-updates log entries at the warning level or higher as they are logged. An entry has
 * the same fields as the entries that `readLogEntriesAsync` returns: `timestamp`, `message`, `code`,
 * `level`, and optionally `updateId`, `assetId`, `stacktrace`, and `duration`.
 */
fun interface UpdatesLogEntryListener {
  /**
   * Called on the thread that logged the entry.
   */
  fun onLogEntry(entry: Map<String, Any>)
}

/**
 * Delivers expo-updates log entries to listeners in the same process, so other modules can report
 * them without reading the log file. It does not depend on whether updates are enabled.
 */
object UpdatesLogEntryListenerRegistry {
  private const val TAG = "UpdatesLogEntryListener"

  private val listeners = CopyOnWriteArrayList<UpdatesLogEntryListener>()

  fun add(listener: UpdatesLogEntryListener) {
    listeners.addIfAbsent(listener)
  }

  fun remove(listener: UpdatesLogEntryListener) {
    listeners.remove(listener)
  }

  /**
   * Delivers the entry to each listener. A listener that throws does not stop the other listeners
   * or the code that logged the entry.
   */
  fun notify(entry: Map<String, Any>) {
    for (listener in listeners) {
      try {
        listener.onLogEntry(entry)
      } catch (e: Exception) {
        Log.e(TAG, "A log entry listener threw an exception", e)
      }
    }
  }
}
