package expo.modules.appmetrics.storage

import android.content.Context
import android.util.Log
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.crashreporting.CrashOrigin
import expo.modules.appmetrics.crashreporting.CrashReport
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import expo.modules.appmetrics.sink.CrashAttributionHint
import expo.modules.appmetrics.sink.MetricsSink
import expo.modules.appmetrics.sink.SessionInfo
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

/** Stores every record in the Room metrics database. */
internal class DatabaseMetricsSink(private val sessionManager: SessionManager) : MetricsSink {
  // Owned by the sink, so a module teardown can't cancel a session insert that later writes wait for.
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  // Every child row has a foreign key to its session row, so writes for a session wait for its insert.
  private val startJobs = ConcurrentHashMap<String, Job>()

  override fun sessionStarted(session: SessionInfo) {
    startJobs[session.id] = scope.launch {
      sessionManager.startSessionWithIdAt(session.id, session.startTimestamp, session.metadata)
      if (session.type == "main") {
        // Sweep sessions orphaned by a previous process. The comparison is strict (`<`), so this
        // session, which starts at the cutoff, survives while older ones are swept.
        sessionManager.deactivateAllSessionsBefore(session.startTimestamp)
      }
    }
  }

  override suspend fun sessionEnded(sessionId: String, endTimestamp: String) {
    awaitStart(sessionId)
    sessionManager.stopSession(sessionId, endTimestamp)
    startJobs.remove(sessionId)
  }

  override suspend fun recordMetrics(metrics: List<MetricRecord>, sessionId: String) {
    awaitStart(sessionId)
    sessionManager.addMetrics(metrics, sessionId)
  }

  override suspend fun recordLogs(logs: List<LogEvent>, sessionId: String) {
    awaitStart(sessionId)
    sessionManager.addLogs(logs, sessionId)
  }

  override suspend fun recordSpans(spans: List<NetworkSpan>, sessionId: String) {
    awaitStart(sessionId)
    for (span in spans) {
      try {
        sessionManager.addSpan(span, sessionId)
      } catch (e: CancellationException) {
        // Must not be swallowed: a canceled caller must not see the batch as written.
        throw e
      } catch (e: Exception) {
        // Swallowed: recording telemetry must never break the network monitor.
        Log.w(TAG, "Failed to persist a network request span", e)
      }
    }
  }

  /** Failures are logged and swallowed so a bad report can't crash the next launch. */
  override suspend fun recordCrash(report: CrashReport, log: LogEvent, hint: CrashAttributionHint) {
    hint.sessionId?.let { awaitStart(it) }
    runCatching {
      // A null target stores the report as an orphan.
      val target: String? = when {
        // JVM file with a real session id → stored under that id.
        hint.sessionId != null -> hint.sessionId.takeIf { sessionManager.getSessionRow(it) != null }
        // Native crash (exit record) → attributed to the previous main session,
        // unless that session already has a crash report, in which case it's stored
        // as an orphan so the existing report isn't overwritten.
        hint.origin == CrashOrigin.EXIT_RECORD ->
          sessionManager.getPreviousMainSessionId(hint.currentSessionId)
            ?.takeIf { sessionManager.getCrashReport(it) == null }
        // id-less JVM file (a crash before the main session existed) → orphan.
        else -> null
      }
      val payload = report.encodeToJsonString()
      if (target != null) {
        sessionManager.storeCrashReportIfNew(target, payload, log)
      } else {
        sessionManager.setCrashReport(null, payload)
      }
    }.onFailure {
      Log.e(TAG, "Failed to persist a crash report", it)
    }
  }

  suspend fun updateEnvironmentForActiveSessions(environment: String) {
    sessionManager.updateEnvironmentForActiveSessions(environment)
  }

  private suspend fun awaitStart(sessionId: String) {
    startJobs[sessionId]?.join()
  }

  companion object {
    @Volatile
    private var instance: DatabaseMetricsSink? = null

    fun getInstance(context: Context): DatabaseMetricsSink =
      instance ?: synchronized(this) {
        instance ?: DatabaseMetricsSink(SessionManager(context.applicationContext)).also { instance = it }
      }
  }
}
