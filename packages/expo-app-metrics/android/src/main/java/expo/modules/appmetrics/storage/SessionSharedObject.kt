package expo.modules.appmetrics.storage

import expo.modules.appmetrics.AppMetadata
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class SessionSharedObject(
  private val sessionManager: SessionManager,
  val type: String,
  customStartTimestamp: String? = null,
  private val metadata: AppMetadata? = null,
  runtime: Runtime? = null
) : SharedObject(runtime) {
  // Generated synchronously so it's available immediately to readers and to
  // collaborators that capture it before the session row has been persisted.
  val sessionId: String = sessionManager.createSessionId()

  // The session's start timestamp, exposed to JS as `startDate`.
  val startDate: String = customStartTimestamp ?: TimeUtils.getCurrentTimestampInISOFormat()

  private val sessionStartMutex = Mutex()
  private var isPersisted = false

  /** Inserts the session row if it isn't persisted yet. A failed insert throws, and the next call retries it. */
  suspend fun ensureSessionPersisted() =
    sessionStartMutex.withLock {
      if (!isPersisted) {
        sessionManager.startSessionWithIdAt(sessionId, startDate, metadata)
        isPersisted = true
      }
    }

  suspend fun addMetrics(metrics: List<Metric>) {
    ensureSessionPersisted()
    sessionManager.addMetrics(metrics, sessionId)
  }

  suspend fun addLogs(logs: List<LogRecord>) {
    ensureSessionPersisted()
    sessionManager.addLogs(logs, sessionId)
  }

  suspend fun stop() {
    ensureSessionPersisted()
    sessionManager.stopSession(sessionId)
  }

  suspend fun isActive(): Boolean = sessionManager.getSessionRow(sessionId)?.isActive ?: true

  suspend fun getEndDate(): String? = sessionManager.getSessionRow(sessionId)?.endTimestamp

  suspend fun getMetrics(): List<Metric> = sessionManager.getMetricsForSession(sessionId)

  suspend fun getLogs(): List<LogRecord> = sessionManager.getLogsForSession(sessionId)
}
