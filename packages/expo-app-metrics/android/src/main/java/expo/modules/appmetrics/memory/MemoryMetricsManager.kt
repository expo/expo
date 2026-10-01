package expo.modules.appmetrics.memory

import android.app.ActivityManager
import android.content.Context
import android.os.Debug
import expo.modules.appmetrics.MemoryMetric
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.sink.MetricsSinkRegistry
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.serialization.Serializable

class MemoryMetricsManager(
  val context: Context
) {
  // If sessionId is null, then snapshot will not be stored
  suspend fun takeMemorySnapshot(sessionId: String? = null): MemoryUsageSnapshot {
    val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val memoryInfo = ActivityManager.MemoryInfo()
    activityManager.getMemoryInfo(memoryInfo)

    val debugMemoryInfo = Debug.MemoryInfo()
    Debug.getMemoryInfo(debugMemoryInfo)

    val runtime = Runtime.getRuntime()

    val snapshot = MemoryUsageSnapshot(
      javaHeap = runtime.totalMemory() - runtime.freeMemory(),
      physical = debugMemoryInfo.totalPss * 1024L, // Convert KB → bytes
      available = runtime.freeMemory()
    )

    sessionId?.let { sessionId ->
      MetricsSinkRegistry.shared.recordMetrics(snapshot.toMetrics(), sessionId)
    }

    return snapshot
  }
}

@Serializable
@OptimizedRecord
data class MemoryUsageSnapshot(
  /**
   * Physical memory in bytes pages currently in use (resident size).
   */
  @Field val physical: Long,
  /**
   * The amount of available memory in bytes that app can still allocate.
   */
  @Field val available: Long,
  /**
   * The amount of memory in bytes currently used by the Java heap.
   */
  @Field val javaHeap: Long
) : Record {
  fun toMetrics(): List<MetricRecord> {
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()
    return listOf(
      MemoryMetric.Physical to physical,
      MemoryMetric.Available to available,
      MemoryMetric.JavaHeap to javaHeap
    ).map {
      MetricRecord(
        category = MemoryMetric.category.categoryName,
        name = it.first.metricName,
        value = it.second.toDouble(),
        timestamp = timestamp
      )
    }
  }
}
