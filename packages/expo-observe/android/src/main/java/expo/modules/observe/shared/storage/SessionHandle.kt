package expo.modules.observe.shared.storage

import expo.modules.observe.shared.AppMetadata
import expo.modules.observe.shared.utils.TimeUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

internal class SessionHandle(
  private val sessionManager: SessionManager,
  private val scope: CoroutineScope,
  val type: String,
  customStartTimestamp: String? = null,
  private val metadata: AppMetadata? = null
) {
  // Generated synchronously so it's available immediately to readers and to
  // collaborators that capture it before the session row has been persisted.
  val sessionId: String = sessionManager.createSessionId()

  // The session's start timestamp, exposed to JS as `startDate`.
  val startDate: String = customStartTimestamp ?: TimeUtils.getCurrentTimestampInISOFormat()

  private val sessionStartJob: Job by lazy {
    scope.launch {
      sessionManager.startSessionWithIdAt(sessionId, startDate, metadata)
    }
  }

  /** Suspends until the session row has been persisted. */
  suspend fun awaitSessionPersisted() = sessionStartJob.join()

  suspend fun addMetrics(metrics: List<Metric>) {
    awaitSessionPersisted()
    sessionManager.addMetrics(metrics, sessionId)
  }

  suspend fun addLogs(logs: List<LogRecord>) {
    awaitSessionPersisted()
    sessionManager.addLogs(logs, sessionId)
  }

  suspend fun stop() {
    awaitSessionPersisted()
    sessionManager.stopSession(sessionId)
  }

  suspend fun isActive(): Boolean = sessionManager.getSessionRow(sessionId)?.isActive ?: true

  suspend fun getEndDate(): String? = sessionManager.getSessionRow(sessionId)?.endTimestamp

  suspend fun getMetrics(): List<Metric> = sessionManager.getMetricsForSession(sessionId)

  suspend fun getLogs(): List<LogRecord> = sessionManager.getLogsForSession(sessionId)
}
