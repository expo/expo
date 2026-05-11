package expo.modules.appmetrics.storage

import android.content.Context
import android.util.Log
import androidx.room.withTransaction
import expo.modules.appmetrics.AppMetadata
import expo.modules.appmetrics.AppMetricsPreferences
import expo.modules.appmetrics.SQLITE_MAX_BIND_VARIABLES
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.utils.TimeUtils
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

class SessionManager(
  context: Context,
  database: MetricsDatabase? = null
) {
  private val context: Context = context
  private val database: MetricsDatabase = database ?: MetricsDatabase.getDatabase(context)

  fun interface MetricsInsertListener {
    suspend fun onMetricsInserted(metricIds: List<String>)
  }

  private val metricsInsertListeners = CopyOnWriteArrayList<MetricsInsertListener>()

  fun addMetricsInsertListener(listener: MetricsInsertListener) {
    metricsInsertListeners.add(listener)
  }

  fun removeMetricsInsertListener(listener: MetricsInsertListener) {
    metricsInsertListeners.remove(listener)
  }

  fun createSessionId(): String = UUID.randomUUID().toString()

  suspend fun startSessionWithIdAt(
    sessionId: String,
    timestamp: String,
    metadata: AppMetadata? = null,
    environment: String? = null
  ) {
    val resolvedEnvironment = environment ?: AppMetricsPreferences.getEnvironment(context)
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

  suspend fun startSessionWithIdAndMetricsAt(
    id: String,
    metrics: List<Metric>,
    timestamp: String,
    metadata: AppMetadata? = null,
    environment: String? = null
  ) {
    database.withTransaction {
      startSessionWithIdAt(
        sessionId = id,
        timestamp = timestamp,
        metadata = metadata,
        environment = environment
      )
      addMetrics(metrics, sessionId = id)
    }
  }

  suspend fun stopSession(sessionId: String) {
    database.sessionDao().stopSessionAt(
      sessionId,
      endTimestamp = TimeUtils.getCurrentTimestampInISOFormat()
    )
  }

  suspend fun addMetrics(
    metrics: List<Metric>,
    sessionId: String
  ) {
    val metricsWithSession = metrics.map { it.copy(sessionId = sessionId) }
    database.metricDao().insertAll(metricsWithSession)
    val metricIds = metricsWithSession.map { it.metricId }
    metricsInsertListeners.forEach { listener ->
      try {
        listener.onMetricsInserted(metricIds)
      } catch (e: Exception) {
        Log.e(TAG, "MetricsInsertListener failed", e)
      }
    }
  }

  suspend fun getAllSessions(): List<SessionWithMetrics> = database.sessionDao().getAll()

  suspend fun getSessionById(id: String): SessionWithMetrics? = database.sessionDao().getSessionWithMetricsBySessionId(id)

  suspend fun getAllActiveSessions(): List<SessionWithMetrics> = database.sessionDao().getAllActiveSessions()

  suspend fun removeSessions(session: List<SessionWithMetrics>) {
    database.sessionDao().delete(session.map { it.session })
  }

  suspend fun clearAllData() {
    database.sessionDao().deleteAll()
  }

  suspend fun deactivateAllSessionsBefore(timestamp: String) {
    database.sessionDao().deactivateAllSessionsBefore(timestamp)
  }

  /**
   * Prunes inactive sessions whose `startTimestamp` is older than the
   * retention window. Their metrics are removed via the foreign-key cascade.
   */
  suspend fun cleanupOldSessions() {
    val cutoffTimestamp = TimeUtils.getTimestampInISOFormatFromPast(MetricsConstants.SECONDS_TO_REMOVE_OLD_METRICS)
    database.sessionDao().deleteSessionsOlderThan(cutoffTimestamp)
  }

  suspend fun updateEnvironmentForActiveSessions(environment: String) {
    database.sessionDao().updateEnvironmentForActiveSessions(environment)
  }

  suspend fun getSessionsWithMetrics(metricIds: List<String>): List<SessionWithMetrics> {
    val metricIdSet = metricIds.toSet()
    if (metricIds.size <= SQLITE_MAX_BIND_VARIABLES) {
      return database.sessionDao().getSessionsWithMetricsByMetricIds(metricIds).map { sessionWithMetrics ->
        sessionWithMetrics.copy(metrics = sessionWithMetrics.metrics.filter { it.metricId in metricIdSet })
      }
    }

    val allResults = metricIds.chunked(SQLITE_MAX_BIND_VARIABLES).flatMap { chunk ->
      database.sessionDao().getSessionsWithMetricsByMetricIds(chunk)
    }
    return allResults
      .groupBy { it.session.id }
      .map { (_, sessions) ->
        SessionWithMetrics(
          session = sessions.first().session,
          metrics = sessions
            .flatMap { it.metrics }
            .distinctBy { it.metricId }
            .filter { it.metricId in metricIdSet }
        )
      }
  }
}
