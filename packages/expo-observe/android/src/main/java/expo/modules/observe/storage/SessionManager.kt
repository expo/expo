package expo.modules.observe.storage

import android.content.Context
import androidx.room.withTransaction
import expo.modules.appmetrics.AppMetadata
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.observe.ObservePreferences
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

// https://sqlite.org/limits.html#:~:text=SQLITE_MAX_VARIABLE_NUMBER%2C%20which%20defaults%20to%20999%20for%20SQLite
// 900 is a safe number slightly below the default limit to avoid hitting the limit
internal const val SQLITE_MAX_BIND_VARIABLES = 900

class SessionManager(
  context: Context,
  database: MetricsDatabase? = null
) {
  private val context: Context = context
  private val database: MetricsDatabase = database ?: MetricsDatabase.getDatabase(context)

  suspend fun startSessionWithIdAt(
    sessionId: String,
    timestamp: String,
    metadata: AppMetadata? = null,
    environment: String? = null
  ) {
    val resolvedEnvironment = environment ?: ObservePreferences.getEnvironment(context)
    val session = Session(
      id = sessionId,
      startTimestamp = timestamp,
      isActive = true,
      environment = resolvedEnvironment,
      appName = metadata?.appName,
      appIdentifier = metadata?.appIdentifier,
      appVersion = metadata?.appVersion,
      appBuildNumber = metadata?.appBuildNumber,
      appUpdateId = metadata?.appUpdatesInfo?.updateId,
      appUpdateRuntimeVersion = metadata?.appUpdatesInfo?.runtimeVersion,
      appUpdateRequestHeaders = metadata?.appUpdatesInfo?.requestHeaders?.let {
        Json.encodeToString(MapSerializer(String.serializer(), String.serializer()), it)
      },
      appEasBuildId = metadata?.appEasBuildId,
      deviceOs = metadata?.deviceOs,
      deviceOsVersion = metadata?.deviceOsVersion,
      deviceModel = metadata?.deviceModel,
      deviceName = metadata?.deviceName,
      expoSdkVersion = metadata?.expoSdkVersion,
      reactNativeVersion = metadata?.reactNativeVersion,
      clientVersion = metadata?.clientVersion,
      languageTag = metadata?.languageTag
    )
    database.sessionDao().insert(session)
  }

  suspend fun stopSession(sessionId: String, endTimestamp: String) {
    database.sessionDao().stopSessionAt(sessionId, endTimestamp)
  }

  suspend fun addMetrics(
    metrics: List<MetricRecord>,
    sessionId: String
  ) {
    database.metricDao().insertAll(metrics.map { it.toEntity(sessionId) })
  }

  /**
   * Inactive sessions with their metrics, logs, and crash report attached, most
   * recent first. The crash report joins via the `sessionId` foreign key, so only
   * attributed reports map back; orphans (null sessionId) are excluded.
   */
  suspend fun getInactiveSessions(): List<SessionWithChildren> =
    database.sessionDao().getInactive()

  /**
   * Persists a crash report. A non-null `sessionId` attributes the report to an
   * existing session (the FK requires the row to exist) and replaces any previous
   * report for it — only one crash per session is meaningful. A null `sessionId`
   * stores an orphan — see `CrashReportEntity`.
   */
  suspend fun setCrashReport(
    sessionId: String?,
    payload: String,
    createdAt: String = TimeUtils.getCurrentTimestampInISOFormat()
  ) {
    database.crashReportDao().upsert(
      CrashReportEntity(sessionId = sessionId, payload = payload, createdAt = createdAt)
    )
  }

  /**
   * Stores a crash report and its log for `sessionId`, but only when the session
   * has no report yet. Reprocessing the same crash must not add a second log.
   */
  suspend fun storeCrashReportIfNew(sessionId: String, payload: String, log: LogEvent) {
    database.withTransaction {
      if (database.crashReportDao().getBySessionId(sessionId) == null) {
        database.crashReportDao().upsert(
          CrashReportEntity(
            sessionId = sessionId,
            payload = payload,
            createdAt = TimeUtils.getCurrentTimestampInISOFormat()
          )
        )
        database.logDao().insertAll(listOf(log.toEntity(sessionId)))
      }
    }
  }

  suspend fun getCrashReport(sessionId: String): String? =
    database.crashReportDao().getBySessionId(sessionId)?.payload

  /**
   * Every stored crash report, newest first — both reports attributed to a
   * session and orphans (startup crashes before the session existed, or native
   * crashes that couldn't be attributed). Returns the entities so callers can
   * read each report's `sessionId` (null for an orphan) alongside its payload.
   */
  suspend fun getAllCrashReports(): List<CrashReportEntity> =
    database.crashReportDao().getAll()

  suspend fun getSessionById(id: String): SessionWithMetrics? = database.sessionDao().getSessionWithMetricsBySessionId(id)

  suspend fun getSessionRow(id: String): Session? = database.sessionDao().getById(id)

  /**
   * The most recent main session other than `currentSessionId`, or `null` when
   * none exists. Used to attribute crashes that carry no session id of their own
   * (native crashes, lost crash files) to the session that most likely produced
   * them — the previous process's. Android has no session `type` column yet, so
   * every stored session is treated as main.
   */
  suspend fun getPreviousMainSessionId(currentSessionId: String?): String? =
    database.sessionDao().getPreviousMainSessionId(currentSessionId)

  suspend fun getMetricsForSession(sessionId: String): List<Metric> =
    database.metricDao().getMetricsForSession(sessionId)

  suspend fun getMetrics(afterId: Long, limit: Int): List<Metric> =
    database.metricDao().getAfterId(afterId, limit)

  suspend fun getMaxMetricId(): Long? = database.metricDao().getMaxId()

  suspend fun getSpansForSession(sessionId: String): List<Span> =
    database.spanDao().getSpansForSession(sessionId)

  suspend fun getSpans(afterId: Long, limit: Int): List<Span> =
    database.spanDao().getSpans(afterId, limit)

  suspend fun getMaxSpanId(): Long? = database.spanDao().getMaxId()

  suspend fun addSpan(span: NetworkSpan, sessionId: String) {
    database.spanDao().insert(span.toEntity(sessionId))
  }

  suspend fun deleteSpansUpTo(rowId: Long) = database.spanDao().deleteUpTo(rowId)

  suspend fun getLogsForSession(sessionId: String): List<LogRecord> =
    database.logDao().getLogsForSession(sessionId)

  suspend fun getLogs(afterId: Long, limit: Int): List<LogRecord> =
    database.logDao().getAfterId(afterId, limit)

  suspend fun getMaxLogId(): Long? = database.logDao().getMaxId()

  suspend fun clearAllData() {
    database.sessionDao().deleteAll()
    // Deleting the sessions cascades to their attributed reports, but orphan
    // reports (null sessionId) don't cascade, so wipe the table explicitly too.
    database.crashReportDao().deleteAll()
  }

  suspend fun deactivateAllSessionsBefore(timestamp: String) {
    database.sessionDao().deactivateAllSessionsBefore(timestamp)
  }

  /**
   * Prunes inactive sessions whose `startTimestamp` is older than the retention
   * window. Their metrics and attributed crash reports are removed via the
   * foreign-key cascade; orphan reports (null sessionId) have no session to
   * cascade from and are aged out separately by `createdAt`.
   */
  suspend fun cleanupOldSessions() {
    val cutoffTimestamp = TimeUtils.getTimestampInISOFormatFromPast(MetricsConstants.SECONDS_TO_REMOVE_OLD_METRICS)
    database.crashReportDao().deleteOrphansOlderThan(cutoffTimestamp)
    database.sessionDao().deleteSessionsOlderThan(cutoffTimestamp)
  }

  suspend fun addLogs(
    logs: List<LogEvent>,
    sessionId: String
  ) {
    database.logDao().insertAll(logs.map { it.toEntity(sessionId) })
  }

  suspend fun cleanupOldLogs() {
    val cutoffTimestamp = TimeUtils.getTimestampInISOFormatFromPast(MetricsConstants.SECONDS_TO_REMOVE_OLD_METRICS)
    database.logDao().deleteLogsOlderThan(cutoffTimestamp)
  }

  suspend fun updateEnvironmentForActiveSessions(environment: String) {
    database.sessionDao().updateEnvironmentForActiveSessions(environment)
  }

  suspend fun getSessions(sessionIds: Collection<String>): List<Session> =
    sessionIds.chunked(SQLITE_MAX_BIND_VARIABLES).flatMap { database.sessionDao().getByIds(it) }
}
