package expo.modules.appmetrics.storage

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.AppMetadata
import expo.modules.appmetrics.AppUpdatesInfo
import expo.modules.appmetrics.BuildConfig
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SessionManagerTest {
  private lateinit var database: MetricsDatabase
  private lateinit var sessionManager: SessionManager

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    sessionManager = SessionManager(context, database)
  }

  @After
  fun tearDown() {
    database.close()
  }

  // region Session Uniqueness Tests

  @Test
  fun `getAllSessions returns each session exactly once`() =
    runTest {
      // Arrange
      val session1Id = "session-1"
      val session2Id = "session-2"
      sessionManager.startSessionWithIdAt(session1Id, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(session2Id, "2025-01-01T01:00:00.000Z")

      // Add multiple metrics to session 1
      val metrics = listOf(
        createMetric("metric-1", session1Id),
        createMetric("metric-2", session1Id),
        createMetric("metric-3", session1Id)
      )
      database.metricDao().insertAll(metrics)

      // Act
      val result = sessionManager.getAllSessions()

      // Assert
      assertEquals(2, result.size)
      val sessionIds = result.map { it.session.id }
      assertEquals(sessionIds.distinct().size, sessionIds.size)
      assertTrue(sessionIds.contains(session1Id))
      assertTrue(sessionIds.contains(session2Id))
    }

  @Test
  fun `getAllActiveSessions returns each active session only once`() =
    runTest {
      // Arrange
      val activeSession1 = "active-1"
      val activeSession2 = "active-2"
      val inactiveSession = "inactive-1"

      sessionManager.startSessionWithIdAt(activeSession1, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(activeSession2, "2025-01-01T01:00:00.000Z")
      sessionManager.startSessionWithIdAt(inactiveSession, "2025-01-01T02:00:00.000Z")
      // Add multiple metrics to each session
      val metrics = listOf(
        createMetric("metric-1", activeSession1),
        createMetric("metric-2", activeSession1),
        createMetric("metric-3", activeSession2),
        createMetric("inactive-metric", inactiveSession)
      )
      database.metricDao().insertAll(metrics)
      sessionManager.stopSession(inactiveSession)

      // Act
      val result = sessionManager.getAllActiveSessions()

      // Assert
      assertEquals(2, result.size)
      val sessionIds = result.map { it.session.id }
      assertEquals(sessionIds.distinct().size, sessionIds.size)
      assertTrue(sessionIds.contains(activeSession1))
      assertTrue(sessionIds.contains(activeSession2))
      assertFalse(sessionIds.contains(inactiveSession))
    }

  // endregion

  // region Session Lifecycle Tests

  @Test
  fun `startSessionWithIdAt creates session with correct metadata`() =
    runTest {
      // Arrange
      val sessionId = "test-session"
      val timestamp = "2025-01-15T10:30:00.000Z"
      val metadata = createTestMetadata(
        appName = "TestApp",
        appIdentifier = "com.test.app",
        appVersion = "1.2.3",
        appBuildNumber = "42",
        appUpdatesInfo = AppUpdatesInfo(
          updateId = "update-123",
          runtimeVersion = null,
          requestHeaders = null
        ),
        deviceOs = "Android",
        deviceOsVersion = "14",
        deviceModel = "Pixel 8",
        deviceName = "oriole",
        expoSdkVersion = "52.0.0",
        reactNativeVersion = "0.76.0",
        clientVersion = "1.0.0",
        languageTag = "en-US"
      )

      // Act
      sessionManager.startSessionWithIdAt(sessionId, timestamp, metadata, environment = "production")

      // Assert
      val sessions = sessionManager.getAllSessions()
      assertEquals(1, sessions.size)

      val session = sessions[0].session
      assertEquals(sessionId, session.id)
      assertEquals(timestamp, session.startTimestamp)
      assertTrue(session.isActive)
      assertEquals("production", session.environment)
      assertEquals("TestApp", session.appName)
      assertEquals("com.test.app", session.appIdentifier)
      assertEquals("1.2.3", session.appVersion)
      assertEquals("42", session.appBuildNumber)
      assertEquals("update-123", session.appUpdateId)
      assertEquals("Android", session.deviceOs)
      assertEquals("14", session.deviceOsVersion)
      assertEquals("Pixel 8", session.deviceModel)
      assertEquals("oriole", session.deviceName)
      assertEquals("52.0.0", session.expoSdkVersion)
      assertEquals("0.76.0", session.reactNativeVersion)
      assertEquals("1.0.0", session.clientVersion)
      assertEquals("en-US", session.languageTag)
    }

  @Test
  fun `startSessionWithIdAt uses environment parameter over preferences default`() =
    runTest {
      // Arrange — Robolectric apps are debuggable, so default would be "development"
      val sessionId = "test-session"
      val metadata = createTestMetadata()

      // Act
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z", metadata, environment = "production")

      // Assert
      val sessions = sessionManager.getAllSessions()
      assertEquals("production", sessions[0].session.environment)
    }

  @Test
  fun `startSessionWithIdAt falls back to preferences environment`() =
    runTest {
      val sessionId = "test-session"
      val expected = if (BuildConfig.DEBUG) "development" else null

      // Act
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      // Assert
      val sessions = sessionManager.getAllSessions()
      assertEquals(expected, sessions[0].session.environment)
    }

  @Test
  fun `stopSession marks session as inactive`() =
    runTest {
      // Arrange
      val sessionId = "test-session"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      // Verify it starts as active
      var sessions = sessionManager.getAllActiveSessions()
      assertEquals(1, sessions.size)

      // Act
      sessionManager.stopSession(sessionId)

      // Assert
      sessions = sessionManager.getAllActiveSessions()
      assertEquals(0, sessions.size)

      val allSessions = sessionManager.getAllSessions()
      assertEquals(1, allSessions.size)
      assertFalse(allSessions[0].session.isActive)
    }

  @Test
  fun `stopSession stamps endTimestamp`() =
    runTest {
      // Arrange
      val sessionId = "test-session"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      // Act
      sessionManager.stopSession(sessionId)

      // Assert
      val stopped = sessionManager.getAllSessions().single()
      assertNotNull("endTimestamp should be set after stopSession", stopped.session.endTimestamp)
    }

  @Test
  fun `deactivateAllSessionsBefore deactivates old sessions only`() =
    runTest {
      // Arrange
      val oldSession = "old-session"
      val newSession = "new-session"
      sessionManager.startSessionWithIdAt(oldSession, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(newSession, "2025-01-15T00:00:00.000Z")

      // Act
      sessionManager.deactivateAllSessionsBefore("2025-01-10T00:00:00.000Z")

      // Assert
      val activeSessions = sessionManager.getAllActiveSessions()
      assertEquals(1, activeSessions.size)
      assertEquals(newSession, activeSessions[0].session.id)
    }

  @Test
  fun `deactivateAllSessionsBefore stamps endTimestamp on orphan sessions`() =
    runTest {
      // Arrange — a session left active across launches (force-killed process,
      // OOM, etc.). On the next module create we deactivate it, and the cutoff
      // timestamp is the heuristic end-time we record.
      val orphan = "orphan-session"
      sessionManager.startSessionWithIdAt(orphan, "2025-01-01T00:00:00.000Z")

      // Act
      val cutoff = "2025-01-10T00:00:00.000Z"
      sessionManager.deactivateAllSessionsBefore(cutoff)

      // Assert
      val deactivated = sessionManager.getAllSessions().single { it.session.id == orphan }
      assertFalse(deactivated.session.isActive)
      assertEquals(cutoff, deactivated.session.endTimestamp)
    }

  @Test
  fun `deactivateAllSessionsBefore preserves existing endTimestamps`() =
    runTest {
      // Arrange — a session that was properly stopped via stopSession should
      // keep its real end time even if it predates the deactivate cutoff.
      val cleanlyStopped = "clean-session"
      sessionManager.startSessionWithIdAt(cleanlyStopped, "2025-01-01T00:00:00.000Z")
      sessionManager.stopSession(cleanlyStopped)
      val originalEnd = sessionManager.getAllSessions()
        .single { it.session.id == cleanlyStopped }
        .session.endTimestamp
      assertNotNull("precondition: stopSession should have stamped endTimestamp", originalEnd)

      // Act
      sessionManager.deactivateAllSessionsBefore("2025-01-10T00:00:00.000Z")

      // Assert — the cleanly-stopped session keeps its original end time.
      val preserved = sessionManager.getAllSessions().single { it.session.id == cleanlyStopped }
      assertEquals(originalEnd, preserved.session.endTimestamp)
    }

  @Test
  fun `updateEnvironmentForActiveSessions updates only active sessions`() =
    runTest {
      // Arrange
      val activeSession = "active-session"
      val inactiveSession = "inactive-session"
      sessionManager.startSessionWithIdAt(activeSession, "2025-01-01T00:00:00.000Z", environment = "staging")
      sessionManager.startSessionWithIdAt(inactiveSession, "2025-01-01T01:00:00.000Z", environment = "staging")
      sessionManager.stopSession(inactiveSession)

      // Act
      sessionManager.updateEnvironmentForActiveSessions("production")

      // Assert
      val allSessions = sessionManager.getAllSessions()
      val active = allSessions.find { it.session.id == activeSession }
      val inactive = allSessions.find { it.session.id == inactiveSession }

      assertEquals("production", active?.session?.environment)
      assertEquals("staging", inactive?.session?.environment)
    }

  // endregion

  // region Metrics Management Tests

  @Test
  fun `addMetrics associates metrics with correct session`() =
    runTest {
      // Arrange
      val session1Id = "session-1"
      val session2Id = "session-2"
      sessionManager.startSessionWithIdAt(session1Id, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(session2Id, "2025-01-01T01:00:00.000Z")

      val metricsForSession1 = listOf(
        createMetric("metric-1", ""),
        createMetric("metric-2", "")
      )
      val metricsForSession2 = listOf(
        createMetric("metric-3", "")
      )

      // Act
      sessionManager.addMetrics(metricsForSession1, session1Id)
      sessionManager.addMetrics(metricsForSession2, session2Id)

      // Assert
      val sessions = sessionManager.getAllSessions()
      val s1 = sessions.find { it.session.id == session1Id }
      val s2 = sessions.find { it.session.id == session2Id }

      assertEquals(2, s1?.metrics?.size)
      assertTrue(s1?.metrics?.all { it.sessionId == session1Id } ?: false)

      assertEquals(1, s2?.metrics?.size)
      assertTrue(s2?.metrics?.all { it.sessionId == session2Id } ?: false)
    }

  // endregion

  // region MetricsInsertListener Tests

  @Test
  fun `addMetrics notifies listeners with inserted metric IDs`() =
    runTest {
      // Arrange
      val sessionId = "session-1"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      val receivedIds = mutableListOf<String>()
      sessionManager.addMetricsInsertListener { metricIds ->
        receivedIds.addAll(metricIds)
      }

      val metrics = listOf(
        createMetric("metric-1", ""),
        createMetric("metric-2", "")
      )

      // Act
      sessionManager.addMetrics(metrics, sessionId)

      // Assert
      assertEquals(2, receivedIds.size)
      assertTrue(receivedIds.contains("metric-1"))
      assertTrue(receivedIds.contains("metric-2"))
    }

  @Test
  fun `addMetrics notifies multiple listeners`() =
    runTest {
      // Arrange
      val sessionId = "session-1"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      val listener1Ids = mutableListOf<String>()
      val listener2Ids = mutableListOf<String>()
      sessionManager.addMetricsInsertListener { metricIds ->
        listener1Ids.addAll(metricIds)
      }
      sessionManager.addMetricsInsertListener { metricIds ->
        listener2Ids.addAll(metricIds)
      }

      val metrics = listOf(createMetric("metric-1", ""))

      // Act
      sessionManager.addMetrics(metrics, sessionId)

      // Assert
      assertEquals(1, listener1Ids.size)
      assertEquals(1, listener2Ids.size)
    }

  @Test
  fun `removeMetricsInsertListener stops notifications`() =
    runTest {
      // Arrange
      val sessionId = "session-1"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      val receivedIds = mutableListOf<String>()
      val listener = SessionManager.MetricsInsertListener { metricIds ->
        receivedIds.addAll(metricIds)
      }
      sessionManager.addMetricsInsertListener(listener)

      // Act - add metrics, then remove listener, then add more metrics
      sessionManager.addMetrics(listOf(createMetric("metric-1", "")), sessionId)
      sessionManager.removeMetricsInsertListener(listener)
      sessionManager.addMetrics(listOf(createMetric("metric-2", "")), sessionId)

      // Assert - only the first metric should have been received
      assertEquals(1, receivedIds.size)
      assertTrue(receivedIds.contains("metric-1"))
    }

  @Test
  fun `startSessionWithIdAndMetricsAt notifies listeners`() =
    runTest {
      // Arrange
      val receivedIds = mutableListOf<String>()
      sessionManager.addMetricsInsertListener { metricIds ->
        receivedIds.addAll(metricIds)
      }

      val metrics = listOf(
        createMetric("metric-1", ""),
        createMetric("metric-2", "")
      )

      // Act
      sessionManager.startSessionWithIdAndMetricsAt(
        id = "session-1",
        metrics = metrics,
        timestamp = "2025-01-01T00:00:00.000Z"
      )

      // Assert
      assertEquals(2, receivedIds.size)
      assertTrue(receivedIds.contains("metric-1"))
      assertTrue(receivedIds.contains("metric-2"))
    }

  // endregion

  // region getSessionsWithMetrics Tests

  @Test
  fun `getSessionsWithMetrics returns sessions with only requested metrics`() =
    runTest {
      // Arrange
      val sessionId = "session-1"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      val metrics = listOf(
        createMetric("metric-1", sessionId),
        createMetric("metric-2", sessionId),
        createMetric("metric-3", sessionId)
      )
      database.metricDao().insertAll(metrics)

      // Act - only request metric-1 and metric-3
      val result = sessionManager.getSessionsWithMetrics(listOf("metric-1", "metric-3"))

      // Assert
      assertEquals(1, result.size)
      assertEquals(sessionId, result[0].session.id)
      assertEquals(2, result[0].metrics.size)
      assertTrue(result[0].metrics.any { it.metricId == "metric-1" })
      assertTrue(result[0].metrics.any { it.metricId == "metric-3" })
    }

  @Test
  fun `getSessionsWithMetrics returns empty when no metrics match`() =
    runTest {
      // Arrange
      val sessionId = "session-1"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
      database.metricDao().insertAll(listOf(createMetric("metric-1", sessionId)))

      // Act
      val result = sessionManager.getSessionsWithMetrics(listOf("nonexistent-metric"))

      // Assert
      assertEquals(0, result.size)
    }

  @Test
  fun `getSessionsWithMetrics returns multiple sessions`() =
    runTest {
      // Arrange
      val session1Id = "session-1"
      val session2Id = "session-2"
      sessionManager.startSessionWithIdAt(session1Id, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(session2Id, "2025-01-01T01:00:00.000Z")

      database.metricDao().insertAll(
        listOf(
          createMetric("metric-1", session1Id),
          createMetric("metric-2", session2Id)
        )
      )

      // Act
      val result = sessionManager.getSessionsWithMetrics(listOf("metric-1", "metric-2"))

      // Assert
      assertEquals(2, result.size)
      val sessionIds = result.map { it.session.id }
      assertTrue(sessionIds.contains(session1Id))
      assertTrue(sessionIds.contains(session2Id))
    }

  @Test
  fun `getSessionsWithMetrics deduplicates sessions spanning multiple chunks`() =
    runTest {
      // Arrange - one session with metrics that will land in different chunks
      val sessionId = "session-1"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      // Insert 1100 metrics into the same session
      val allMetricIds = (1..1100).map { "metric-$it" }
      allMetricIds.chunked(500).forEach { chunk ->
        val metrics = chunk.map { createMetric(it, sessionId) }
        database.metricDao().insertAll(metrics)
      }

      // Act - query all 1100 metric IDs
      val result = sessionManager.getSessionsWithMetrics(allMetricIds)

      // Assert - session should appear exactly once with all 1100 metrics
      assertEquals(1, result.size)
      assertEquals(sessionId, result[0].session.id)
      assertEquals(1100, result[0].metrics.size)
    }

  @Test
  fun `getSessionsWithMetrics filters correctly across chunk boundaries`() =
    runTest {
      // Arrange - session has 1200 metrics, but we only request 1100 of them
      val sessionId = "session-1"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      val allMetricIds = (1..1200).map { "metric-$it" }
      allMetricIds.chunked(500).forEach { chunk ->
        val metrics = chunk.map { createMetric(it, sessionId) }
        database.metricDao().insertAll(metrics)
      }

      // Request only the first 1100
      val requestedIds = allMetricIds.take(1100)

      // Act
      val result = sessionManager.getSessionsWithMetrics(requestedIds)

      // Assert - only the 1100 requested metrics should be returned, not all 1200
      assertEquals(1, result.size)
      assertEquals(1100, result[0].metrics.size)
      val returnedIds = result[0].metrics.map { it.metricId }.toSet()
      assertFalse(returnedIds.contains("metric-1101"))
      assertFalse(returnedIds.contains("metric-1200"))
    }

  @Test
  fun `getSessionsWithMetrics merges multiple sessions across chunks`() =
    runTest {
      // Arrange - two sessions, each with metrics spanning chunk boundaries
      val session1Id = "session-1"
      val session2Id = "session-2"
      sessionManager.startSessionWithIdAt(session1Id, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(session2Id, "2025-01-01T01:00:00.000Z")

      // Session 1 gets metrics 1-600, session 2 gets metrics 601-1200
      val s1MetricIds = (1..600).map { "metric-$it" }
      val s2MetricIds = (601..1200).map { "metric-$it" }

      s1MetricIds.chunked(500).forEach { chunk ->
        database.metricDao().insertAll(chunk.map { createMetric(it, session1Id) })
      }
      s2MetricIds.chunked(500).forEach { chunk ->
        database.metricDao().insertAll(chunk.map { createMetric(it, session2Id) })
      }

      val allIds = s1MetricIds + s2MetricIds

      // Act - query all 1200 IDs
      val result = sessionManager.getSessionsWithMetrics(allIds)

      // Assert - both sessions returned, each with correct metric count
      assertEquals(2, result.size)
      val s1 = result.find { it.session.id == session1Id }!!
      val s2 = result.find { it.session.id == session2Id }!!
      assertEquals(600, s1.metrics.size)
      assertEquals(600, s2.metrics.size)
    }

  @Test
  fun `getSessionsWithMetrics yields empty logs from the chunked merger path`() =
    runTest {
      // Arrange — the chunked-merger branch in `getSessionsWithMetrics`
      // constructs `SessionWithMetrics(...)` without passing logs and relies on
      // the `= emptyList()` default. The session DOES have logs in storage,
      // but the merger projects metrics-only. This test fails loudly if the
      // default is removed or the merger ever needs to surface logs too.
      val sessionId = "session-with-logs"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      val metricIds = (1..1100).map { "metric-$it" }
      metricIds.chunked(500).forEach { chunk ->
        database.metricDao().insertAll(chunk.map { createMetric(it, sessionId) })
      }
      // Also insert logs so an accidental relation-load would surface them.
      database.logDao().insertAll(listOf(createLog("log-a", sessionId)))

      // Act — 1100 IDs forces the chunked path
      val result = sessionManager.getSessionsWithMetrics(metricIds)

      // Assert
      assertEquals(1, result.size)
      assertEquals(emptyList<LogRecord>(), result[0].logs)
    }

  // endregion

  // region Data Cleanup Tests

  @Test
  fun `removeSessions deletes sessions and cascades to metrics`() =
    runTest {
      // Arrange
      val sessionId = "session-to-delete"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      val metrics = listOf(
        createMetric("metric-1", sessionId),
        createMetric("metric-2", sessionId)
      )
      database.metricDao().insertAll(metrics)

      val sessionsBeforeDelete = sessionManager.getAllSessions()
      assertEquals(1, sessionsBeforeDelete.size)
      assertEquals(2, sessionsBeforeDelete[0].metrics.size)

      // Act
      sessionManager.removeSessions(sessionsBeforeDelete)

      // Assert
      val sessionsAfterDelete = sessionManager.getAllSessions()
      assertEquals(0, sessionsAfterDelete.size)
    }

  @Test
  fun `clearAllData removes all sessions and metrics`() =
    runTest {
      // Arrange
      val session1Id = "session-1"
      val session2Id = "session-2"
      sessionManager.startSessionWithIdAt(session1Id, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(session2Id, "2025-01-01T01:00:00.000Z")

      database.metricDao().insertAll(
        listOf(
          createMetric("metric-1", session1Id),
          createMetric("metric-2", session1Id),
          createMetric("metric-3", session2Id)
        )
      )

      // Verify data exists
      assertEquals(2, sessionManager.getAllSessions().size)

      // Act
      sessionManager.clearAllData()

      // Assert
      assertEquals(0, sessionManager.getAllSessions().size)
    }

  @Test
  fun `cleanupOldSessions removes inactive sessions older than the retention window`() =
    runTest {
      // Arrange — three sessions across the cutoff. We can't pick a static
      // timestamp like the other tests because the retention window is computed
      // from `now`, so we anchor against the current time.
      val now = System.currentTimeMillis()
      val retentionMs = MetricsConstants.SECONDS_TO_REMOVE_OLD_METRICS * 1000
      val isoFormatter = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
        .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }

      val staleStoppedId = "stale-stopped"
      val staleActiveId = "stale-active"
      val freshStoppedId = "fresh-stopped"

      val staleStart = isoFormatter.format(java.util.Date(now - retentionMs - 60_000))
      val freshStart = isoFormatter.format(java.util.Date(now - 60_000))

      sessionManager.startSessionWithIdAt(staleStoppedId, staleStart)
      sessionManager.stopSession(staleStoppedId)

      sessionManager.startSessionWithIdAt(staleActiveId, staleStart)
      // Intentionally not stopped — simulates a long-running session.

      sessionManager.startSessionWithIdAt(freshStoppedId, freshStart)
      sessionManager.stopSession(freshStoppedId)

      // Act
      sessionManager.cleanupOldSessions()

      // Assert — only the stopped, stale session is gone. The active stale
      // session is preserved (we don't pull a session out from under a
      // long-running process), and the fresh stopped session is preserved.
      val remaining = sessionManager.getAllSessions().map { it.session.id }.toSet()
      assertFalse("stale stopped session should be cleaned up", remaining.contains(staleStoppedId))
      assertTrue("stale but active session should be preserved", remaining.contains(staleActiveId))
      assertTrue("fresh stopped session should be preserved", remaining.contains(freshStoppedId))
    }

  @Test
  fun `getAllSessions populates the logs relation alongside metrics`() =
    runTest {
      // Arrange — exercises the Room `@Relation` for `LogRecord` end-to-end.
      // Unit-level mapper tests construct `SessionWithMetrics` directly and
      // never hit the DAO, so this is the only path that catches a schema or
      // foreign-key misconfiguration.
      val sessionId = "session-with-mixed-events"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
      database.metricDao().insertAll(
        listOf(
          createMetric("metric-a", sessionId),
          createMetric("metric-b", sessionId)
        )
      )
      database.logDao().insertAll(
        listOf(
          createLog("log-a", sessionId, name = "auth.login_failed", severity = "warn"),
          createLog("log-b", sessionId, name = "user.signed_in", severity = "info"),
          createLog("log-c", sessionId, name = "cache.miss", severity = "debug")
        )
      )

      // Act
      val sessions = sessionManager.getAllSessions()

      // Assert
      val session = sessions.single { it.session.id == sessionId }
      assertEquals(2, session.metrics.size)
      assertEquals(3, session.logs.size)
      assertEquals(setOf("log-a", "log-b", "log-c"), session.logs.map { it.logId }.toSet())
    }

  @Test
  fun `getAllSessions yields an empty logs list when no logs exist for the session`() =
    runTest {
      // Arrange — a session with metrics but no logs. The relation should
      // populate as an empty list, not null.
      val sessionId = "session-no-logs"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
      database.metricDao().insertAll(listOf(createMetric("metric-1", sessionId)))

      // Act
      val sessions = sessionManager.getAllSessions()

      // Assert
      val session = sessions.single { it.session.id == sessionId }
      assertEquals(emptyList<LogRecord>(), session.logs)
    }

  // endregion

  // region Helper Methods

  private fun createMetric(
    metricId: String,
    sessionId: String,
    name: String = "test-metric",
    category: String = "test",
    value: Double = 123.45
  ): Metric =
    Metric(
      metricId = metricId,
      sessionId = sessionId,
      timestamp = "2025-01-01T00:00:00.000Z",
      category = category,
      name = name,
      value = value,
      routeName = null,
      params = null
    )

  private fun createLog(
    logId: String,
    sessionId: String,
    name: String = "test.event",
    severity: String = "info",
    attributes: String? = null
  ): LogRecord =
    LogRecord(
      logId = logId,
      sessionId = sessionId,
      timestamp = "2025-01-01T00:00:00.000Z",
      name = name,
      body = null,
      severity = severity,
      attributes = attributes,
      droppedAttributesCount = 0
    )

  private fun createTestMetadata(
    appName: String? = "TestApp",
    appIdentifier: String = "com.test.app",
    appVersion: String? = "1.0.0",
    appBuildNumber: String? = "1",
    appUpdatesInfo: AppUpdatesInfo? = null,
    appEasBuildId: String? = null,
    deviceOs: String? = "Android",
    deviceOsVersion: String? = "14",
    deviceModel: String? = "Pixel 8",
    deviceName: String? = "oriole",
    expoSdkVersion: String = "52.0.0",
    reactNativeVersion: String = "0.76.0",
    clientVersion: String? = null,
    languageTag: String? = "en-US"
  ): AppMetadata =
    AppMetadata(
      appName = appName,
      appIdentifier = appIdentifier,
      appVersion = appVersion,
      appBuildNumber = appBuildNumber,
      appUpdatesInfo = appUpdatesInfo,
      appEasBuildId = appEasBuildId,
      languageTag = languageTag,
      deviceOs = deviceOs,
      deviceOsVersion = deviceOsVersion,
      deviceModel = deviceModel,
      deviceName = deviceName,
      expoSdkVersion = expoSdkVersion,
      reactNativeVersion = reactNativeVersion,
      clientVersion = clientVersion
    )

  // endregion
}
