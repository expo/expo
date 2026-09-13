package expo.modules.appmetrics.storage

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.AppMetadata
import expo.modules.appmetrics.AppUpdatesInfo
import expo.modules.appmetrics.BuildConfig
import expo.modules.appmetrics.SQLITE_MAX_BIND_VARIABLES
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
      val session = database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!.session
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
      val session = database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!.session
      assertEquals("production", session.environment)
    }

  @Test
  fun `startSessionWithIdAt falls back to preferences environment`() =
    runTest {
      val sessionId = "test-session"
      val expected = if (BuildConfig.DEBUG) "development" else null

      // Act
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      // Assert
      val session = database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!.session
      assertEquals(expected, session.environment)
    }

  @Test
  fun `stopSession marks session as inactive`() =
    runTest {
      // Arrange
      val sessionId = "test-session"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      // Verify it starts as active
      assertTrue(database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!.session.isActive)

      // Act
      sessionManager.stopSession(sessionId)

      // Assert
      assertFalse(database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!.session.isActive)
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
      val stopped = database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!
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
      assertFalse(database.sessionDao().getSessionWithMetricsBySessionId(oldSession)!!.session.isActive)
      assertTrue(database.sessionDao().getSessionWithMetricsBySessionId(newSession)!!.session.isActive)
    }

  @Test
  fun `deactivateAllSessionsBefore excludes a session whose startTimestamp equals the cutoff`() =
    runTest {
      // The active-session safety in AppMetricsModule depends on this being a
      // strict `<` comparison, NOT `<=`: a freshly-created session shares its
      // start timestamp with the sweep cutoff, so it must survive the sweep even
      // though it can run after the session's own INSERT.
      val cutoff = "2025-01-10T00:00:00.000Z"
      val atCutoff = "at-cutoff-session"
      val justBefore = "just-before-session"
      sessionManager.startSessionWithIdAt(atCutoff, cutoff)
      sessionManager.startSessionWithIdAt(justBefore, "2025-01-09T23:59:59.999Z")

      // Act
      sessionManager.deactivateAllSessionsBefore(cutoff)

      // Assert — equal to the cutoff is preserved (proves `<`), strictly older
      // is deactivated.
      assertTrue(database.sessionDao().getSessionWithMetricsBySessionId(atCutoff)!!.session.isActive)
      assertFalse(database.sessionDao().getSessionWithMetricsBySessionId(justBefore)!!.session.isActive)
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
      val deactivated = database.sessionDao().getSessionWithMetricsBySessionId(orphan)!!
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
      val originalEnd = database.sessionDao().getSessionWithMetricsBySessionId(cleanlyStopped)!!
        .session.endTimestamp
      assertNotNull("precondition: stopSession should have stamped endTimestamp", originalEnd)

      // Act
      sessionManager.deactivateAllSessionsBefore("2025-01-10T00:00:00.000Z")

      // Assert — the cleanly-stopped session keeps its original end time.
      val preserved = database.sessionDao().getSessionWithMetricsBySessionId(cleanlyStopped)!!
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
      val active = database.sessionDao().getSessionWithMetricsBySessionId(activeSession)
      val inactive = database.sessionDao().getSessionWithMetricsBySessionId(inactiveSession)

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
      val s1 = database.sessionDao().getSessionWithMetricsBySessionId(session1Id)
      val s2 = database.sessionDao().getSessionWithMetricsBySessionId(session2Id)

      assertEquals(2, s1?.metrics?.size)
      assertTrue(s1?.metrics?.all { it.sessionId == session1Id } ?: false)

      assertEquals(1, s2?.metrics?.size)
      assertTrue(s2?.metrics?.all { it.sessionId == session2Id } ?: false)
    }

  // endregion

  // region Cursor Reads

  @Test
  fun `getMetrics returns auto-generated IDs after cursor in ascending order with limit`() = runTest {
    val sessionId = "session-1"
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addMetrics(
      listOf(createMetric("first", sessionId), createMetric("second", sessionId), createMetric("third", sessionId)),
      sessionId
    )

    val all = sessionManager.getMetrics(afterId = -1, limit = 10)
    assertEquals(listOf("first", "second", "third"), all.map { it.name })
    assertTrue(all.zipWithNext().all { (first, second) -> first.id < second.id })
    assertEquals(listOf("second"), sessionManager.getMetrics(all.first().id, 1).map { it.name })
    assertEquals(all.last().id, sessionManager.getMaxMetricId())
  }

  @Test
  fun `getMaxMetricId returns null when metrics are empty`() = runTest {
    assertNull(sessionManager.getMaxMetricId())
  }

  @Test
  fun `getLogs returns auto-generated IDs after cursor in ascending order with limit`() = runTest {
    val sessionId = "session-1"
    sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
    sessionManager.addLogs(
      listOf(createLog("first", sessionId), createLog("second", sessionId), createLog("third", sessionId)),
      sessionId
    )

    val all = sessionManager.getLogs(afterId = -1, limit = 10)
    assertEquals(listOf("first", "second", "third"), all.map { it.name })
    assertTrue(all.zipWithNext().all { (first, second) -> first.id < second.id })
    assertEquals(listOf("second"), sessionManager.getLogs(all.first().id, 1).map { it.name })
    assertEquals(all.last().id, sessionManager.getMaxLogId())
  }

  @Test
  fun `getMaxLogId returns null when logs are empty`() = runTest {
    assertNull(sessionManager.getMaxLogId())
  }

  @Test
  fun `getSessions reads IDs across SQLite bind chunks`() = runTest {
    val ids = (0..SQLITE_MAX_BIND_VARIABLES).map { "session-$it" }
    ids.forEachIndexed { index, id ->
      sessionManager.startSessionWithIdAt(id, "2025-01-01T00:00:${index % 60}.000Z")
    }

    assertEquals(ids.toSet(), sessionManager.getSessions(ids).map { it.id }.toSet())
  }

  // endregion

  // region Data Cleanup Tests

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
      assertNotNull(database.sessionDao().getSessionWithMetricsBySessionId(session1Id))
      assertNotNull(database.sessionDao().getSessionWithMetricsBySessionId(session2Id))

      // Act
      sessionManager.clearAllData()

      // Assert
      assertNull(database.sessionDao().getSessionWithMetricsBySessionId(session1Id))
      assertNull(database.sessionDao().getSessionWithMetricsBySessionId(session2Id))
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
      assertNull(
        "stale stopped session should be cleaned up",
        database.sessionDao().getSessionWithMetricsBySessionId(staleStoppedId)
      )
      assertNotNull(
        "stale but active session should be preserved",
        database.sessionDao().getSessionWithMetricsBySessionId(staleActiveId)
      )
      assertNotNull(
        "fresh stopped session should be preserved",
        database.sessionDao().getSessionWithMetricsBySessionId(freshStoppedId)
      )
    }

  @Test
  fun `getSessionWithMetricsBySessionId populates the logs relation alongside metrics`() =
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
      val session = database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!

      // Assert
      assertEquals(2, session.metrics.size)
      assertEquals(3, session.logs.size)
      assertEquals(setOf("auth.login_failed", "user.signed_in", "cache.miss"), session.logs.map { it.name }.toSet())
    }

  @Test
  fun `getSessionWithMetricsBySessionId yields an empty logs list when no logs exist for the session`() =
    runTest {
      // Arrange — a session with metrics but no logs. The relation should
      // populate as an empty list, not null.
      val sessionId = "session-no-logs"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
      database.metricDao().insertAll(listOf(createMetric("metric-1", sessionId)))

      // Act
      val session = database.sessionDao().getSessionWithMetricsBySessionId(sessionId)!!

      // Assert
      assertEquals(emptyList<LogRecord>(), session.logs)
    }

  // endregion

  // region Live Session Reader Tests

  @Test
  fun `getSessionRow reflects live isActive and endTimestamp`() =
    runTest {
      // Arrange
      val sessionId = "test-session"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")

      // Assert: live row reports the session as active with no end timestamp
      val active = sessionManager.getSessionRow(sessionId)
      assertNotNull(active)
      assertTrue(active!!.isActive)
      assertNull(active.endTimestamp)

      // Act: end the session
      sessionManager.stopSession(sessionId)

      // Assert: the same query now reflects the ended state
      val ended = sessionManager.getSessionRow(sessionId)
      assertNotNull(ended)
      assertFalse(ended!!.isActive)
      assertNotNull(ended.endTimestamp)
    }

  @Test
  fun `getSessionRow returns null for an unknown session`() =
    runTest {
      assertNull(sessionManager.getSessionRow("does-not-exist"))
    }

  @Test
  fun `getMetricsForSession returns only that session's metrics`() =
    runTest {
      // Arrange
      val sessionId = "session-1"
      val otherId = "session-2"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(otherId, "2025-01-01T01:00:00.000Z")
      database.metricDao().insertAll(
        listOf(
          createMetric("metric-1", sessionId),
          createMetric("metric-2", sessionId),
          createMetric("metric-3", otherId)
        )
      )

      // Act
      val metrics = sessionManager.getMetricsForSession(sessionId)

      // Assert
      assertEquals(setOf("metric-1", "metric-2"), metrics.map { it.name }.toSet())
      assertTrue(metrics.all { it.sessionId == sessionId })
    }

  @Test
  fun `getLogsForSession returns only that session's logs`() =
    runTest {
      // Arrange
      val sessionId = "session-1"
      val otherId = "session-2"
      sessionManager.startSessionWithIdAt(sessionId, "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt(otherId, "2025-01-01T01:00:00.000Z")
      database.logDao().insertAll(
        listOf(
          createLog("log-1", sessionId),
          createLog("log-2", sessionId),
          createLog("log-3", otherId)
        )
      )

      // Act
      val logs = sessionManager.getLogsForSession(sessionId)

      // Assert
      assertEquals(setOf("log-1", "log-2"), logs.map { it.name }.toSet())
      assertTrue(logs.all { it.sessionId == sessionId })
    }

  // endregion

  // region Helper Methods

  private fun createMetric(
    metricName: String,
    sessionId: String,
    name: String = metricName,
    category: String = "test",
    value: Double = 123.45,
    timestamp: String = "2025-01-01T00:00:00.000Z"
  ): Metric =
    Metric(
      sessionId = sessionId,
      timestamp = timestamp,
      category = category,
      name = name,
      value = value,
      routeName = null,
      params = null
    )

  private fun createLog(
    logName: String,
    sessionId: String,
    name: String = logName,
    severity: String = "info",
    attributes: String? = null,
    timestamp: String = "2025-01-01T00:00:00.000Z"
  ): LogRecord =
    LogRecord(
      sessionId = sessionId,
      timestamp = timestamp,
      name = name,
      body = null,
      severity = severity,
      attributes = attributes,
      droppedAttributesCount = 0
    )

  // region getPreviousMainSessionId

  @Test
  fun `getPreviousMainSessionId returns the most recent session excluding the current one`() =
    runTest {
      sessionManager.startSessionWithIdAt("older", "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt("previous", "2025-01-01T01:00:00.000Z")
      sessionManager.startSessionWithIdAt("current", "2025-01-01T02:00:00.000Z")

      assertEquals("previous", sessionManager.getPreviousMainSessionId("current"))
    }

  @Test
  fun `getPreviousMainSessionId returns the latest session when none is current`() =
    runTest {
      sessionManager.startSessionWithIdAt("older", "2025-01-01T00:00:00.000Z")
      sessionManager.startSessionWithIdAt("newer", "2025-01-01T01:00:00.000Z")

      assertEquals("newer", sessionManager.getPreviousMainSessionId(null))
    }

  @Test
  fun `getPreviousMainSessionId returns null when only the current session exists`() =
    runTest {
      sessionManager.startSessionWithIdAt("current", "2025-01-01T00:00:00.000Z")

      assertNull(sessionManager.getPreviousMainSessionId("current"))
    }

  // endregion

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
