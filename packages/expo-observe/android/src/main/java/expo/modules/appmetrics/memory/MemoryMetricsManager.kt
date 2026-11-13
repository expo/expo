package expo.modules.appmetrics.memory

import android.app.ActivityManager
import android.content.Context
import android.os.Debug
import expo.modules.appmetrics.MemoryMetric
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.utils.TimeUtils
import kotlinx.serialization.Serializable

internal class MemoryMetricsManager(
  val context: Context,
  val sessionManager: SessionManager
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
      val metrics = snapshot.toMetrics(sessionId)
      sessionManager.addMetrics(metrics, sessionId = sessionId)
    }

    return snapshot
  }
}

@Serializable
internal data class MemoryUsageSnapshot(
  /**
   * Physical memory in bytes pages currently in use (resident size).
   */
  val physical: Long,
  /**
   * The amount of available memory in bytes that app can still allocate.
   */
  val available: Long,
  /**
   * The amount of memory in bytes currently used by the Java heap.
   */
  val javaHeap: Long
) {
  fun toMetrics(sessionId: String): List<Metric> {
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()
    return listOf(
      MemoryMetric.Physical to physical,
      MemoryMetric.Available to available,
      MemoryMetric.JavaHeap to javaHeap
    ).map {
      Metric(
        sessionId = sessionId,
        category = MemoryMetric.category.categoryName,
        name = it.first.metricName,
        value = it.second.toDouble(),
        timestamp = timestamp
      )
    }
  }
}
