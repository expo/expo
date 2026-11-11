package expo.modules.appmetrics.spans

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.appmetrics.storage.Session
import expo.modules.appmetrics.storage.Span
import kotlinx.coroutines.asExecutor
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLog

private const val START_MS = 1_782_131_895_000
private const val END_MS = 1_782_131_895_250

private fun makeRow(name: String = "checkout", sessionId: String = "s"): Span {
  val recorder = SpanRecorder(name = name, sessionId = sessionId, startTimestampMs = START_MS)
  return checkNotNull(recorder.end(statusCode = null, statusMessage = null, endTimestampMs = END_MS))
}

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SpanWriterTest {
  // Shared by `runTest` and Room's executors, so `advanceUntilIdle` waits for the inserts the
  // writer launches instead of racing them.
  private val testDispatcher = StandardTestDispatcher()

  private lateinit var database: MetricsDatabase

  @Before
  fun setUp() {
    ShadowLog.stream = System.out
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .setQueryExecutor(testDispatcher.asExecutor())
      .setTransactionExecutor(testDispatcher.asExecutor())
      .build()
  }

  @After
  fun tearDown() {
    database.close()
  }

  private suspend fun insertSession(id: String) {
    database.sessionDao().insert(Session(id = id, startTimestamp = "2026-08-13T10:00:00.000Z"))
  }

  private suspend fun allSpanNames() = database.spanDao().getSpans(afterId = -1, limit = Int.MAX_VALUE).map { it.name }

  @Test
  fun `writes a row`() = runTest(testDispatcher) {
    insertSession("s")
    SpanWriter(database = database, scope = this).write(makeRow())
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("checkout"), allSpanNames())
  }

  @Test
  fun `waits for the session row before inserting`() = runTest(testDispatcher) {
    // The session row only exists once the wait returns, so the foreign key accepts the insert
    // only when it runs after the wait.
    val writer = SpanWriter(database = database, scope = this) {
      insertSession("s")
    }
    writer.write(makeRow())
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("checkout"), allSpanNames())
  }

  @Test
  fun `a failed insert does not stop later writes`() = runTest(testDispatcher) {
    insertSession("s")
    val writer = SpanWriter(database = database, scope = this)
    // No session has this id, so the foreign key rejects the insert.
    writer.write(makeRow(name = "orphan", sessionId = "missing"))
    writer.write(makeRow(name = "kept"))
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("kept"), allSpanNames())
  }

  @Test
  fun `writeAll writes every row and reports completion once`() = runTest(testDispatcher) {
    insertSession("s")
    var completions = 0
    SpanWriter(database = database, scope = this).writeAll(onComplete = { completions += 1 }) {
      listOf(makeRow(name = "first"), makeRow(name = "second"))
    }
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("first", "second"), allSpanNames())
    assertEquals(1, completions)
  }

  @Test
  fun `writeAll keeps writing past a failed row`() = runTest(testDispatcher) {
    insertSession("s")
    var completions = 0
    SpanWriter(database = database, scope = this).writeAll(onComplete = { completions += 1 }) {
      listOf(
        makeRow(name = "first"),
        makeRow(name = "orphan", sessionId = "missing"),
        makeRow(name = "last")
      )
    }
    testScheduler.advanceUntilIdle()
    assertEquals(listOf("first", "last"), allSpanNames())
    assertEquals(1, completions)
  }

  @Test
  fun `writeAll does not report completion when the session wait fails`() = runTest(testDispatcher) {
    // The caller retries a batch that did not complete, so a failed wait must not count as done.
    var completions = 0
    val writer = SpanWriter(database = database, scope = this) {
      throw IllegalStateException("session insert failed")
    }
    writer.writeAll(onComplete = { completions += 1 }) {
      listOf(makeRow())
    }
    testScheduler.advanceUntilIdle()
    assertEquals(0, completions)
    assertTrue(allSpanNames().isEmpty())
  }
}
