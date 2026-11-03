package expo.modules.appmetrics.storage

import android.content.Context
import android.database.sqlite.SQLiteException
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.spyk
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Exercises the lifecycle logic folded out of the old `SessionCoordinator` and
 * into [SessionSharedObject]: the ENG-21739 ordering guarantee (the session row
 * is INSERTed before any metric/log write touches it), and `stop()`.
 *
 * Uses the same Robolectric + in-memory Room harness as [SessionManagerTest],
 * constructing the object with no runtime (the default) so it stays unlinked
 * from any JS runtime.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SessionSharedObjectTest {
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

  @Test
  fun `addMetrics persists the session row before writing the metric`() =
    runTest {
      // Arrange — a fresh session that has NOT been awaited yet.
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )
      assertNull(sessionManager.getSessionRow(session.sessionId))

      // Act — the very first touch is a write. If the INSERT didn't run first,
      // the FK on metrics.sessionId would throw FOREIGN KEY constraint failed.
      session.addMetrics(listOf(createMetric("metric-1", session.sessionId)))

      // Assert — both the row and the metric exist.
      assertNotNull(sessionManager.getSessionRow(session.sessionId))
      assertEquals(
        setOf("metric-1"),
        sessionManager.getMetricsForSession(session.sessionId).map { it.name }.toSet()
      )
    }

  @Test
  fun `addLogs persists the session row before writing the log`() =
    runTest {
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )
      assertNull(sessionManager.getSessionRow(session.sessionId))

      session.addLogs(listOf(createLog("log-1", session.sessionId)))

      assertNotNull(sessionManager.getSessionRow(session.sessionId))
      assertEquals(
        setOf("log-1"),
        sessionManager.getLogsForSession(session.sessionId).map { it.name }.toSet()
      )
    }

  @Test
  fun `startTimestamp defaults to construction time when omitted`() =
    runTest {
      // No startTimestamp passed — the object stamps it from the constructor.
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "custom"
      )

      // startDate is populated synchronously at construction...
      assertTrue(session.startDate.isNotBlank())

      // ...and is the timestamp persisted for the row.
      session.ensureSessionPersisted()
      assertEquals(
        session.startDate,
        sessionManager.getSessionRow(session.sessionId)!!.startTimestamp
      )
    }

  @Test
  fun `ensureSessionPersisted inserts the session row exactly once`() =
    runTest {
      // Spy so we can count the real INSERT. We can't assert this via the DB:
      // session inserts use OnConflictStrategy.IGNORE, so a duplicate run would
      // be silently swallowed and leave exactly one row regardless.
      val spy = spyk(sessionManager)
      val session = SessionSharedObject(
        sessionManager = spy,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )

      // Two concurrent callers plus a third sequential call — only the first
      // one inserts the row.
      val a = launch { session.ensureSessionPersisted() }
      val b = launch { session.ensureSessionPersisted() }
      a.join()
      b.join()
      session.ensureSessionPersisted()

      coVerify(exactly = 1) { spy.startSessionWithIdAt(any(), any(), any(), any()) }
      assertNotNull(sessionManager.getSessionRow(session.sessionId))
    }

  @Test
  fun `a failed session start skips the write`() =
    runTest {
      val spy = spyk(sessionManager)
      coEvery { spy.startSessionWithIdAt(any(), any(), any(), any()) } throws SQLiteException("disk I/O error")
      val session = SessionSharedObject(
        sessionManager = spy,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )

      val result = runCatching { session.addMetrics(listOf(createMetric("metric-1", session.sessionId))) }

      assertTrue(result.exceptionOrNull() is SQLiteException)
      coVerify(exactly = 0) { spy.addMetrics(any(), any()) }
    }

  @Test
  fun `a write after a failed session start retries the start`() =
    runTest {
      val spy = spyk(sessionManager)
      coEvery { spy.startSessionWithIdAt(any(), any(), any(), any()) } throws
        SQLiteException("disk I/O error") coAndThen {
          sessionManager.startSessionWithIdAt(firstArg(), secondArg(), thirdArg(), arg(3))
        }
      val session = SessionSharedObject(
        sessionManager = spy,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )
      runCatching { session.addMetrics(listOf(createMetric("metric-1", session.sessionId))) }

      session.addMetrics(listOf(createMetric("metric-2", session.sessionId)))

      assertNotNull(sessionManager.getSessionRow(session.sessionId))
      assertEquals(listOf("metric-2"), session.getMetrics().map { it.name })
    }

  @Test
  fun `stop persists the session row then stamps the end timestamp`() =
    runTest {
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )

      session.stop()

      val row = sessionManager.getSessionRow(session.sessionId)
      assertNotNull(row)
      assertFalse(row!!.isActive)
      assertNotNull(row.endTimestamp)
    }

  @Test
  fun `isActive and getEndDate reflect the persisted row across stop`() =
    runTest {
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )
      session.ensureSessionPersisted()

      assertTrue(session.isActive())
      assertNull(session.getEndDate())

      session.stop()

      assertFalse(session.isActive())
      assertNotNull(session.getEndDate())
    }

  @Test
  fun `isActive defaults to true before the row is persisted`() =
    runTest {
      // Never persisted, so the row isn't inserted yet — the read
      // is optimistic rather than blocking.
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )

      assertTrue(session.isActive())
      assertNull(session.getEndDate())
      assertNull(sessionManager.getSessionRow(session.sessionId))
    }

  @Test
  fun `getMetrics and getLogs are empty before the row is persisted`() =
    runTest {
      // Never persisted — no row, no entries. The optimistic read returns empty
      // collections rather than inserting the row.
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )

      assertEquals(emptyList<Metric>(), session.getMetrics())
      assertEquals(emptyList<LogRecord>(), session.getLogs())
    }

  @Test
  fun `a freshly persisted session reads as active with no metrics or logs`() =
    runTest {
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )
      session.ensureSessionPersisted()

      // Row exists now, but nothing has been written to it yet.
      assertTrue(session.isActive())
      assertNull(session.getEndDate())
      assertEquals(emptyList<Metric>(), session.getMetrics())
      assertEquals(emptyList<LogRecord>(), session.getLogs())
    }

  @Test
  fun `getMetrics and getLogs return this session's persisted entries`() =
    runTest {
      val session = SessionSharedObject(
        sessionManager = sessionManager,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )

      session.addMetrics(listOf(createMetric("metric-1", session.sessionId)))
      session.addLogs(listOf(createLog("log-1", session.sessionId)))

      assertEquals(setOf("metric-1"), session.getMetrics().map { it.name }.toSet())
      assertEquals(setOf("log-1"), session.getLogs().map { it.name }.toSet())
    }

  @Test
  fun `getters never trigger the session-start persist`() =
    runTest {
      // Reads are intentionally NOT gated on ensureSessionPersisted(): they read
      // through optimistically and must never insert the session row.
      val spy = spyk(sessionManager)
      val session = SessionSharedObject(
        sessionManager = spy,
        type = "main",
        customStartTimestamp = "2025-01-01T00:00:00.000Z"
      )

      session.isActive()
      session.getEndDate()
      session.getMetrics()
      session.getLogs()

      // No INSERT was issued and the row still doesn't exist.
      coVerify(exactly = 0) { spy.startSessionWithIdAt(any(), any(), any(), any()) }
      assertNull(sessionManager.getSessionRow(session.sessionId))
    }

  // region Helpers

  private fun createMetric(
    name: String,
    sessionId: String
  ): Metric =
    Metric(
      sessionId = sessionId,
      timestamp = "2025-01-01T00:00:00.000Z",
      category = "test",
      name = name,
      value = 123.45,
      routeName = null,
      params = null
    )

  private fun createLog(
    name: String,
    sessionId: String
  ): LogRecord =
    LogRecord(
      sessionId = sessionId,
      timestamp = "2025-01-01T00:00:00.000Z",
      name = name,
      body = null,
      severity = "info",
      attributes = null,
      droppedAttributesCount = 0
    )

  // endregion
}
