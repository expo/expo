package expo.modules.appmetrics.crashreporting

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.appmetrics.storage.SessionManager
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Covers `attributeAndStoreCrashReport` — the session-aware half of crash processing. */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CrashReportAttributionTest {
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

  private suspend fun attribute(
    sessionId: String?,
    origin: CrashOrigin,
    currentSessionId: String? = "current",
    message: String = "boom"
  ) =
    attributeAndStoreCrashReport(
      sessionManager = sessionManager,
      currentSessionId = currentSessionId,
      sessionId = sessionId,
      origin = origin,
      report = report(message)
    )

  private fun report(message: String = "boom"): CrashReport =
    CrashReport.fromThrowable(
      throwable = IllegalStateException(message),
      crashTimestamp = "2026-06-12T10:00:00.000Z",
      ingestedAt = "2026-06-12T10:05:00.000Z",
      appVersion = "1.0.0"
    )

  private suspend fun storedMessage(sessionId: String): String? =
    sessionManager.getCrashReport(sessionId)
      ?.let { CrashReport.decodeFromJsonString(it) }
      ?.exceptionReason

  // region JVM crash files (embedded id)

  @Test
  fun `stores a file report under its embedded session id`() =
    runTest {
      sessionManager.startSessionWithIdAt("crashed-session", "2023-11-14T22:00:00.000Z")

      attribute("crashed-session", CrashOrigin.JVM_FILE)

      assertEquals("java.lang.IllegalStateException: boom", storedMessage("crashed-session"))
    }

  @Test
  fun `stores a file report as an orphan when its session row never persisted`() =
    runTest {
      // A crash whose session row never landed can't satisfy the FK, so it's
      // stored unattributed rather than dropped.
      attribute("never-persisted", CrashOrigin.JVM_FILE)

      assertNull(sessionManager.getCrashReport("never-persisted"))
      assertEquals(1, sessionManager.getOrphanCrashReportPayloads().size)
    }

  @Test
  fun `stores an id-less file report as an orphan`() =
    runTest {
      // A crash before the main session existed carries no id.
      attribute(null, CrashOrigin.JVM_FILE)

      assertEquals(1, sessionManager.getOrphanCrashReportPayloads().size)
    }

  // endregion

  // region Native crashes (no id) → previous main session

  @Test
  fun `attributes a native crash to the previous main session`() =
    runTest {
      sessionManager.startSessionWithIdAt("older", "2023-11-14T20:00:00.000Z")
      sessionManager.startSessionWithIdAt("previous", "2023-11-14T22:00:00.000Z")

      attribute(null, CrashOrigin.EXIT_RECORD, currentSessionId = "current", message = "native")

      assertEquals("java.lang.IllegalStateException: native", storedMessage("previous"))
      assertNull(sessionManager.getCrashReport("older"))
    }

  @Test
  fun `stores a native crash as an orphan when only the current session exists`() =
    runTest {
      sessionManager.startSessionWithIdAt("current", "2023-11-14T22:00:00.000Z")

      attribute(null, CrashOrigin.EXIT_RECORD, currentSessionId = "current")

      // Never blame the live session — stored unattributed instead.
      assertNull(sessionManager.getCrashReport("current"))
      assertEquals(1, sessionManager.getOrphanCrashReportPayloads().size)
    }

  @Test
  fun `stores a native crash as an orphan when there are no sessions at all`() =
    runTest {
      attribute(null, CrashOrigin.EXIT_RECORD, currentSessionId = "current")

      assertEquals(1, sessionManager.getOrphanCrashReportPayloads().size)
    }

  @Test
  fun `orphans a native crash when the previous session already has a report`() =
    runTest {
      // A file already stored a (richer) report for "previous" this run, so a
      // native crash resolving to "previous" must not overwrite it.
      sessionManager.startSessionWithIdAt("previous", "2023-11-14T22:00:00.000Z")

      attribute("previous", CrashOrigin.JVM_FILE, message = "from file")
      attribute(null, CrashOrigin.EXIT_RECORD, message = "from record")

      assertEquals("java.lang.IllegalStateException: from file", storedMessage("previous"))
      // The native crash landed as a separate orphan, not overwriting "previous".
      assertEquals(1, sessionManager.getOrphanCrashReportPayloads().size)
    }

  // endregion

  // region Failure

  @Test
  fun `swallows a database write failure`() =
    runTest {
      database.close()

      // Must not throw — a failed persist is logged and swallowed so it can't
      // crash the next launch.
      attribute("crashed-session", CrashOrigin.JVM_FILE)
    }

  // endregion
}
