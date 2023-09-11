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
  context: Context
) {

  /**
   * Purge expo-updates logs older than the given date
   */
  fun purgeLogEntries(
    olderThan: Date = Date(Date().time - ONE_DAY_MILLISECONDS),
    completionHandler: (_: Error?) -> Unit
  ) {
    val epochTimestamp = epochFromDateOrOneDayAgo(olderThan)
    persistentLog.purgeEntriesNotMatchingFilter(
      { entryString -> isEntryStringLaterThanTimestamp(entryString, epochTimestamp) },
      completionHandler
    )
  }

  /**
   * Get expo-updates logs newer than the given date
   * Returns a list of strings in the JSON format of UpdatesLogEntry
   */
  fun getLogEntries(newerThan: Date): List<String> {
    val epochTimestamp = epochFromDateOrOneDayAgo(newerThan)
    return persistentLog.readEntries()
      .filter { entryString -> isEntryStringLaterThanTimestamp(entryString, epochTimestamp) }
  }

  private val persistentLog = PersistentFileLog(EXPO_UPDATES_LOGGING_TAG, context)

  private fun isEntryStringLaterThanTimestamp(entryString: String, timestamp: Long): Boolean {
    val entry = UpdatesLogEntry.create(entryString) ?: return false
    return entry.timestamp >= timestamp
  }

  private fun epochFromDateOrOneDayAgo(date: Date): Long {
    // Returns the epoch (milliseconds since 1/1/1970)
    // If date is earlier than one day ago, then the epoch for one day ago is returned
    // instead
    val earliestEpoch = Date().time - ONE_DAY_MILLISECONDS
    val epoch = date.time
    return max(epoch, earliestEpoch)
  }

  companion object {
    private const val ONE_DAY_MILLISECONDS = 86400
  }
}
