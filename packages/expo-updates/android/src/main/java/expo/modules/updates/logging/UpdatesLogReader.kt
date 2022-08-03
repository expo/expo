package expo.modules.updates.logging

import android.content.Context
import expo.modules.core.logging.PersistentFileLog
import expo.modules.updates.logging.UpdatesLogger.Companion.EXPO_UPDATES_LOGGING_TAG
import java.lang.Error
import java.lang.Long.max
import java.util.*

/**
 * Class for reading expo-updates logs
 */
class UpdatesLogReader(
  private val context: Context
) {

  /**
   * Purge expo-updates logs older than the given date
   */
  fun purgeLogEntries(
    olderThan: Date = Date(Date().time - ONE_DAY_MILLISECONDS),
    completionHandler: ((_: Error?) -> Unit)
  ) {
    val epochTimestamp = _epochFromDate(olderThan)
    persistentLog.filterEntries(
      { entryString -> _entryStringLaterThanTimestamp(entryString, epochTimestamp) },
      {
        completionHandler(it)
      }
    )
  }

  /**
   Get expo-updates logs newer than the given date
   Returns a list of strings in the JSON format of UpdatesLogEntry
   */
  fun getLogEntries(newerThan: Date): List<String> {
    val epochTimestamp = _epochFromDate(newerThan)
    return persistentLog.readEntries()
      .filter { entryString -> _entryStringLaterThanTimestamp(entryString, epochTimestamp) }
  }

  private val persistentLog = PersistentFileLog(EXPO_UPDATES_LOGGING_TAG, context)

  private fun _entryStringLaterThanTimestamp(entryString: String, timestamp: Long): Boolean {
    val entry = UpdatesLogEntry.create(entryString)
    return when (entry) {
      null -> false
      else -> {
        entry.timestamp >= timestamp
      }
    }
  }

  private fun _epochFromDate(date: Date): Long {
    val earliestEpoch = Date().time - ONE_DAY_MILLISECONDS
    val epoch = date.time
    return max(epoch, earliestEpoch)
  }

  companion object {
    private val ONE_DAY_MILLISECONDS = 86400
  }
}
