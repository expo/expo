package expo.modules.appmetrics.storage

import expo.modules.appmetrics.AppMetadata
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/**
 * Owns the main's session lifecycle and gates every write on the session row
 * being persisted first.
 *
 * `metrics.sessionId` / `logs.sessionId` have a foreign key to `sessions.id`, so
 * a metric or log written before its session row exists fails with
 * `SQLiteConstraintException: FOREIGN KEY constraint failed` (ENG-21739).
 *
 * To guarantee ordering, the session row is created lazily by [sessionStartJob]
 * (exactly once), and every write joins that job via [awaitSessionReady] before
 * touching the database.
 */
class SessionCoordinator(
  private val sessionManager: SessionManager,
  private val scope: CoroutineScope,
  // Sessions left active by a previous process (force-quit, OOM, crash) are
  // deactivated up to this timestamp before the new session is created.
  private val deactivateBefore: String,
  private val startTimestamp: String,
  private val metadata: AppMetadata?
) {
  // Generated synchronously so it's available immediately to readers and to
  // collaborators (e.g. `UpdatesMonitoring`) that capture it before the session
  // row has been persisted.
  val sessionId: String = sessionManager.createSessionId()

  // The session row is persisted on first access and exactly once: `by lazy`
  // runs the initializer a single time even across threads, so no
  // explicit lock or volatile flag is needed.
  private val sessionStartJob: Job by lazy {
    scope.launch {
      // Deactivate must run before the INSERT: the new session's
      // `startTimestamp` is the process-start time, which is older than
      // `deactivateBefore`, so inserting first would let the sweep mark the
      // brand-new active session inactive.
      sessionManager.deactivateAllSessionsBefore(deactivateBefore)
      sessionManager.startSessionWithIdAt(sessionId, startTimestamp, metadata)
    }
  }

  /** Suspends until the session row has been persisted (kicked off lazily on first call). */
  suspend fun awaitSessionReady() = sessionStartJob.join()

  suspend fun addMetrics(metrics: List<Metric>) {
    awaitSessionReady()
    sessionManager.addMetrics(metrics, sessionId)
  }

  suspend fun addLogs(logs: List<LogRecord>) {
    awaitSessionReady()
    sessionManager.addLogs(logs, sessionId)
  }

  suspend fun stopSession() {
    awaitSessionReady()
    sessionManager.stopSession(sessionId)
  }
}
