package expo.modules.appmetrics.storage

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.utils.TimeUtils
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CrashReportStorageTest {
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

  private suspend fun startSession(
    id: String,
    startTimestamp: String = "2025-01-15T10:30:00.000Z"
  ) {
    sessionManager.startSessionWithIdAt(id, startTimestamp)
  }

  // region DAO

  @Test
  fun `stores and reads back a crash report payload`() =
    runTest {
      startSession("session-1")

      sessionManager.setCrashReport("session-1", """{"appVersion":"1.0.0"}""")

      assertEquals("""{"appVersion":"1.0.0"}""", sessionManager.getCrashReport("session-1"))
    }

  @Test
  fun `replaces a previously stored report for the same session`() =
    runTest {
      startSession("session-1")

      sessionManager.setCrashReport("session-1", """{"appVersion":"1.0.0"}""")
      sessionManager.setCrashReport("session-1", """{"appVersion":"2.0.0"}""")

      assertEquals("""{"appVersion":"2.0.0"}""", sessionManager.getCrashReport("session-1"))
    }

  @Test
  fun `stores an orphan crash report with a null session id`() =
    runTest {
      // A crash that can't be attributed (fired before the session row existed,
      // or a native crash with nowhere to attach) lands as an orphan: null
      // sessionId, kept distinct by its own id.
      sessionManager.setCrashReport(null, """{"appVersion":"1.0.0"}""")
      sessionManager.setCrashReport(null, """{"appVersion":"2.0.0"}""")

      // Both coexist — the unique sessionId index treats nulls as distinct.
      assertEquals(2, sessionManager.getOrphanCrashReportPayloads().size)
    }

  @Test
  fun `getOrphanCrashReportPayloads returns only unattributed reports, newest first`() =
    runTest {
      startSession("session-1")
      sessionManager.setCrashReport("session-1", """{"appVersion":"attributed"}""")
      sessionManager.setCrashReport(
        null,
        """{"appVersion":"older-orphan"}""",
        createdAt = "2025-01-15T10:00:00.000Z"
      )
      sessionManager.setCrashReport(
        null,
        """{"appVersion":"newer-orphan"}""",
        createdAt = "2025-01-15T11:00:00.000Z"
      )

      val orphans = sessionManager.getOrphanCrashReportPayloads()

      assertEquals(
        listOf("""{"appVersion":"newer-orphan"}""", """{"appVersion":"older-orphan"}"""),
        orphans
      )
    }

  @Test
  fun `cascade deletes the report when its session is deleted`() =
    runTest {
      startSession("session-1")
      sessionManager.setCrashReport("session-1", """{"appVersion":"1.0.0"}""")

      database.sessionDao().deleteAll()

      assertNull(sessionManager.getCrashReport("session-1"))
    }

  @Test
  fun `returns null for a session without a crash report`() =
    runTest {
      startSession("session-1")

      assertNull(sessionManager.getCrashReport("session-1"))
    }

  // endregion

  // region getInactiveSessions

  @Test
  fun `attaches crash payloads to their sessions`() =
    runTest {
      startSession("crashed", startTimestamp = "2025-01-15T10:00:00.000Z")
      startSession("clean", startTimestamp = "2025-01-15T11:00:00.000Z")
      sessionManager.stopSession("crashed")
      sessionManager.stopSession("clean")
      sessionManager.setCrashReport("crashed", """{"appVersion":"1.0.0"}""")

      val sessions = sessionManager.getInactiveSessions()

      val crashed = sessions.first { it.session.id == "crashed" }
      val clean = sessions.first { it.session.id == "clean" }
      assertEquals("""{"appVersion":"1.0.0"}""", crashed.crashReportPayload)
      assertNull(clean.crashReportPayload)
    }

  @Test
  fun `keeps the inactive-session ordering of getInactiveSessions`() =
    runTest {
      startSession("older", startTimestamp = "2025-01-15T10:00:00.000Z")
      startSession("newer", startTimestamp = "2025-01-15T11:00:00.000Z")
      sessionManager.stopSession("older")
      sessionManager.stopSession("newer")

      val sessions = sessionManager.getInactiveSessions()

      assertEquals(
        listOf("newer", "older"),
        sessions.map { it.session.id }
      )
    }

  @Test
  fun `excludes active sessions`() =
    runTest {
      startSession("active")
      sessionManager.setCrashReport("active", """{"appVersion":"1.0.0"}""")

      val sessions = sessionManager.getInactiveSessions()

      assertEquals(emptyList<SessionWithChildren>(), sessions)
    }

  // endregion

  // region Pruning

  @Test
  fun `cleanupOldSessions removes crash reports of pruned sessions`() =
    runTest {
      val oldTimestamp = "2020-01-01T00:00:00.000Z"
      startSession("ancient", startTimestamp = oldTimestamp)
      sessionManager.stopSession("ancient")
      sessionManager.setCrashReport("ancient", """{"appVersion":"1.0.0"}""")

      sessionManager.cleanupOldSessions()

      assertNull(sessionManager.getCrashReport("ancient"))
    }

  @Test
  fun `cleanupOldSessions keeps the crash report of an old but still-active session`() =
    runTest {
      // `deleteSessionsOlderThan` protects live sessions; their crash reports
      // must be protected the same way (and must not be aged out as orphans —
      // the session row exists).
      startSession("long-lived", startTimestamp = "2020-01-01T00:00:00.000Z")
      sessionManager.setCrashReport(
        "long-lived",
        """{"appVersion":"1.0.0"}""",
        createdAt = "2020-01-01T00:00:00.000Z"
      )

      sessionManager.cleanupOldSessions()

      assertEquals("""{"appVersion":"1.0.0"}""", sessionManager.getCrashReport("long-lived"))
    }

  @Test
  fun `cleanupOldSessions keeps crash reports of recent sessions`() =
    runTest {
      startSession("recent", startTimestamp = TimeUtils.getCurrentTimestampInISOFormat())
      sessionManager.stopSession("recent")
      sessionManager.setCrashReport("recent", """{"appVersion":"1.0.0"}""")

      sessionManager.cleanupOldSessions()

      assertEquals("""{"appVersion":"1.0.0"}""", sessionManager.getCrashReport("recent"))
    }

  @Test
  fun `cleanupOldSessions removes orphan crash reports past the retention window`() =
    runTest {
      sessionManager.setCrashReport(
        null,
        """{"appVersion":"1.0.0"}""",
        createdAt = "2020-01-01T00:00:00.000Z"
      )

      sessionManager.cleanupOldSessions()

      assertEquals(emptyList<String>(), sessionManager.getOrphanCrashReportPayloads())
    }

  @Test
  fun `cleanupOldSessions keeps recent orphan crash reports`() =
    runTest {
      // A recent orphan (no owning session) must survive pruning until the
      // retention window passes.
      sessionManager.setCrashReport(null, """{"appVersion":"1.0.0"}""")

      sessionManager.cleanupOldSessions()

      assertEquals(1, sessionManager.getOrphanCrashReportPayloads().size)
    }

  @Test
  fun `clearAllData wipes crash reports`() =
    runTest {
      startSession("session-1")
      sessionManager.setCrashReport("session-1", """{"appVersion":"1.0.0"}""")
      sessionManager.setCrashReport(null, """{"appVersion":"1.0.0"}""")

      sessionManager.clearAllData()

      assertNull(sessionManager.getCrashReport("session-1"))
      assertEquals(emptyList<String>(), sessionManager.getOrphanCrashReportPayloads())
    }

  // endregion
}
