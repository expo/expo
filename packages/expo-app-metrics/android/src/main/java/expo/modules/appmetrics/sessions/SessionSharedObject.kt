package expo.modules.appmetrics.sessions

import expo.modules.appmetrics.AppMetadata
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.sink.MetricsSinkRegistry
import expo.modules.appmetrics.sink.SessionInfo
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.UUID

class SessionSharedObject(
  val type: String,
  customStartTimestamp: String? = null,
  private val metadata: AppMetadata? = null,
  runtime: Runtime? = null
) : SharedObject(runtime) {
  // Generated synchronously so it's available immediately to readers and to
  // collaborators that capture it before the session has started.
  val sessionId: String = UUID.randomUUID().toString()

  // The session's start timestamp, exposed to JS as `startDate`.
  val startDate: String = customStartTimestamp ?: TimeUtils.getCurrentTimestampInISOFormat()

  // Written by `stop` on the thread that tears the module down, read from JS.
  @Volatile
  private var endDate: String? = null

  fun start() {
    MetricsSinkRegistry.shared.sessionStarted(SessionInfo(sessionId, type, startDate, metadata))
  }

  suspend fun addMetrics(metrics: List<MetricRecord>) {
    MetricsSinkRegistry.shared.recordMetrics(metrics, sessionId)
  }

  suspend fun addLogs(logs: List<LogEvent>) {
    MetricsSinkRegistry.shared.recordLogs(logs, sessionId)
  }

  suspend fun stop() {
    val endDate = TimeUtils.getCurrentTimestampInISOFormat()
    this.endDate = endDate
    MetricsSinkRegistry.shared.sessionEnded(sessionId, endDate)
  }

  fun isActive(): Boolean = endDate == null

  fun getEndDate(): String? = endDate
}
