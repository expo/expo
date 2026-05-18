package expo.modules.observe.storage

import android.content.Context
import androidx.room.withTransaction
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.observe.SQLITE_MAX_BIND_VARIABLES

class PendingMetricsManager(
  context: Context,
  database: ObserveDatabase? = null
) {
  private val database: ObserveDatabase = database ?: ObserveDatabase.getDatabase(context)

  suspend fun addPendingMetrics(metricIds: List<String>) {
    val now = TimeUtils.getCurrentTimestampInISOFormat()
    val pendingMetrics = metricIds.map { PendingMetric(metricId = it, addedAt = now) }
    database.pendingMetricDao().insertAll(pendingMetrics)
  }

  suspend fun getAllPendingMetricIds(): List<String> = database.pendingMetricDao().getAllMetricIds()

  suspend fun removePendingMetrics(metricIds: List<String>) {
    database.withTransaction {
      metricIds.chunked(SQLITE_MAX_BIND_VARIABLES).forEach { chunk ->
        database.pendingMetricDao().deleteByIds(chunk)
      }
    }
  }

  suspend fun cleanupOldPendingMetrics() {
    val cutoffTimestamp = TimeUtils.getTimestampInISOFormatFromPast(SECONDS_TO_REMOVE_OLD_PENDING_METRICS)
    database.pendingMetricDao().deleteOlderThan(cutoffTimestamp)
  }

  companion object {
    private const val SECONDS_TO_REMOVE_OLD_PENDING_METRICS: Long = 7 * 24 * 60 * 60 // 7 days in seconds
  }
}
