package expo.modules.appmetrics.storage

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SpanStorageTest {
  private lateinit var database: MetricsDatabase

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .build()
  }

  @After
  fun tearDown() {
    database.close()
  }

  private suspend fun insertSession(id: String) {
    database.sessionDao().insert(
      Session(id = id, startTimestamp = "2026-08-13T10:00:00.000Z")
    )
  }

  private fun makeSpan(
    sessionId: String,
    name: String = "GET",
    kind: Int = Span.CLIENT_KIND,
    startTimestampMs: Long = 1_782_131_895_000,
    endTimestampMs: Long = 1_782_131_895_250,
    statusCode: Int? = null,
    statusMessage: String? = null,
    attributes: String? = null,
    events: String? = null
  ) = Span(
    sessionId = sessionId,
    name = name,
    kind = kind,
    startTimestampMs = startTimestampMs,
    endTimestampMs = endTimestampMs,
    statusCode = statusCode,
    statusMessage = statusMessage,
    attributes = attributes,
    events = events
  )

  @Test
  fun `insert assigns increasing row ids`() = runTest {
    insertSession("s")
    val firstId = database.spanDao().insert(makeSpan(sessionId = "s"))
    val secondId = database.spanDao().insert(makeSpan(sessionId = "s"))
    assertTrue(secondId > firstId)
  }

  @Test
  fun `getAll returns rows in ascending row id order`() = runTest {
    insertSession("s")
    database.spanDao().insert(makeSpan(sessionId = "s", name = "a"))
    database.spanDao().insert(makeSpan(sessionId = "s", name = "b"))
    database.spanDao().insert(makeSpan(sessionId = "s", name = "c"))
    val rows = database.spanDao().getAll()
    assertEquals(listOf("a", "b", "c"), rows.map { it.name })
    assertEquals(rows.map { it.id }.sorted(), rows.map { it.id })
  }

  @Test
  fun `span round-trips its full payload`() = runTest {
    insertSession("s")
    database.spanDao().insert(
      Span(
        sessionId = "s",
        traceId = "a3ce929d0e0e4736a3ce929d0e0e4736",
        spanId = "00f067aa0ba902b7",
        parentSpanId = "abcdef0123456789",
        name = "POST",
        kind = Span.CLIENT_KIND,
        startTimestampMs = 1_782_131_895_000,
        endTimestampMs = 1_782_131_895_250,
        statusCode = Span.STATUS_ERROR,
        statusMessage = "went wrong",
        attributes = """{"url.full":"https://example.com"}""",
        events = """[{"name":"http.redirect"}]"""
      )
    )
    val row = database.spanDao().getAll().single()
    assertEquals("s", row.sessionId)
    assertEquals("a3ce929d0e0e4736a3ce929d0e0e4736", row.traceId)
    assertEquals("00f067aa0ba902b7", row.spanId)
    assertEquals("abcdef0123456789", row.parentSpanId)
    assertEquals("POST", row.name)
    assertEquals(Span.CLIENT_KIND, row.kind)
    assertEquals(1_782_131_895_000, row.startTimestampMs)
    assertEquals(1_782_131_895_250, row.endTimestampMs)
    assertEquals(Span.STATUS_ERROR, row.statusCode)
    assertEquals("went wrong", row.statusMessage)
    assertEquals("""{"url.full":"https://example.com"}""", row.attributes)
    assertEquals("""[{"name":"http.redirect"}]""", row.events)
  }

  @Test
  fun `span round-trips absent optionals as null`() = runTest {
    insertSession("s")
    database.spanDao().insert(makeSpan(sessionId = "s"))
    val row = database.spanDao().getAll().single()
    assertNull(row.parentSpanId)
    assertNull(row.statusCode)
    assertNull(row.statusMessage)
    assertNull(row.attributes)
    assertNull(row.events)
  }

  @Test
  fun `getMaxId reflects the newest row and null when empty`() = runTest {
    assertNull(database.spanDao().getMaxId())
    insertSession("s")
    database.spanDao().insert(makeSpan(sessionId = "s"))
    val lastId = database.spanDao().insert(makeSpan(sessionId = "s"))
    assertEquals(lastId, database.spanDao().getMaxId())
  }

  @Test
  fun `deleteUpTo removes rows up to and including the given row id`() = runTest {
    insertSession("s")
    database.spanDao().insert(makeSpan(sessionId = "s"))
    val secondId = database.spanDao().insert(makeSpan(sessionId = "s"))
    val thirdId = database.spanDao().insert(makeSpan(sessionId = "s"))
    database.spanDao().deleteUpTo(secondId)
    assertEquals(listOf(thirdId), database.spanDao().getAll().map { it.id })
  }

  @Test
  fun `spans are deleted when their session is deleted`() = runTest {
    insertSession("s")
    database.spanDao().insert(makeSpan(sessionId = "s"))
    database.sessionDao().deleteAll()
    assertTrue(database.spanDao().getAll().isEmpty())
  }

  @Test
  fun `insertCapped prunes the oldest rows past the retention cap`() = runTest {
    // Span producers (network requests especially) can record orders of magnitude more rows
    // than metrics or logs. The cap bounds the table when nothing consumes (and deletes) the rows.
    insertSession("s")
    repeat(SpanDao.SPAN_CAP + 10) {
      database.spanDao().insertCapped(makeSpan(sessionId = "s"))
    }
    val rows = database.spanDao().getAll()
    assertTrue(rows.size <= SpanDao.SPAN_CAP)
    // The newest rows survive.
    val maxId = rows.maxOf { it.id }
    assertEquals(maxId, rows.last().id)
  }

  @Test
  fun `generated identifiers are lowercase hex of the required lengths`() {
    // The ingestion endpoint rejects a span whose ids aren't exactly 32 and 16 hex characters.
    val span = makeSpan(sessionId = "s")
    assertEquals(32, span.traceId.length)
    assertEquals(16, span.spanId.length)
    assertTrue(span.traceId.all { it.isDigit() || it in 'a'..'f' })
    assertTrue(span.spanId.all { it.isDigit() || it in 'a'..'f' })
    assertNotEquals("0".repeat(32), span.traceId)
    assertNotEquals("0".repeat(16), span.spanId)
  }

  @Test
  fun `each new span receives distinct identifiers`() {
    // Ids are assigned once at record time and persisted, so a redelivered row (export is
    // at-least-once) reaches the server byte-identical instead of becoming a fresh duplicate.
    val ids = (0 until 128).map { makeSpan(sessionId = "s").traceId }.toSet()
    assertEquals(128, ids.size)
  }
}
