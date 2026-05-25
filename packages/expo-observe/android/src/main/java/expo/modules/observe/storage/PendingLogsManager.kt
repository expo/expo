package expo.modules.observe.storage

import android.content.Context
import androidx.room.withTransaction
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.observe.SQLITE_MAX_BIND_VARIABLES

class PendingLogsManager(
  context: Context,
  database: ObserveDatabase? = null
) {
  private val database: ObserveDatabase = database ?: ObserveDatabase.getDatabase(context)

  suspend fun addPendingLogs(logIds: List<String>) {
    val now = TimeUtils.getCurrentTimestampInISOFormat()
    val pendingLogs = logIds.map { PendingLog(logId = it, addedAt = now) }
    database.pendingLogDao().insertAll(pendingLogs)
  }

  suspend fun getAllPendingLogIds(): List<String> = database.pendingLogDao().getAllLogIds()

  suspend fun removePendingLogs(logIds: List<String>) {
    database.withTransaction {
      logIds.chunked(SQLITE_MAX_BIND_VARIABLES).forEach { chunk ->
        database.pendingLogDao().deleteByIds(chunk)
      }
    }
  }

  suspend fun cleanupOldPendingLogs() {
    val cutoffTimestamp = TimeUtils.getTimestampInISOFormatFromPast(SECONDS_TO_REMOVE_OLD_PENDING_LOGS)
    database.pendingLogDao().deleteOlderThan(cutoffTimestamp)
  }

  companion object {
    private const val SECONDS_TO_REMOVE_OLD_PENDING_LOGS: Long = 7 * 24 * 60 * 60 // 7 days in seconds
  }
}
