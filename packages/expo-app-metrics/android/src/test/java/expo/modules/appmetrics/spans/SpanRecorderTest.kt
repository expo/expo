package expo.modules.appmetrics.spans

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.appmetrics.storage.Session
import expo.modules.appmetrics.storage.Span
import kotlinx.coroutines.test.runTest
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

private const val START_MS = 1_782_131_895_000
private const val END_MS = 1_782_131_895_250

private fun makeRecorder(
  name: String = "checkout",
  sessionId: String = "s",
  parentTraceId: String? = null,
  parentSpanId: String? = null,
  attributes: Map<String, Any?>? = null
) = SpanRecorder(
  name = name,
  sessionId = sessionId,
  parentTraceId = parentTraceId,
  parentSpanId = parentSpanId,
  attributes = attributes,
  startTimestampMs = START_MS
)

private fun endedRow(recorder: SpanRecorder, statusCode: Int? = null, statusMessage: String? = null): Span {
  return checkNotNull(recorder.end(statusCode = statusCode, statusMessage = statusMessage, endTimestampMs = END_MS))
}

private fun attributes(row: Span): JSONObject {
  return JSONObject(checkNotNull(row.attributes))
}

private fun events(row: Span): JSONArray {
  return JSONArray(checkNotNull(row.events))
}

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SpanRecorderTest {
  @Test
  fun `mints a fresh trace for a root span`() {
    val recorder = makeRecorder()
    assertEquals(32, recorder.traceId.length)
    assertEquals(16, recorder.spanId.length)
    assertNull(recorder.parentSpanId)
  }

  @Test
  fun `a child continues its parent's trace and references its span id`() {
    val parent = makeRecorder()
    val child = makeRecorder(parentTraceId = parent.traceId, parentSpanId = parent.spanId)
    assertEquals(parent.traceId, child.traceId)
    assertEquals(parent.spanId, child.parentSpanId)
    assertNotEquals(parent.spanId, child.spanId)
  }

  @Test
  fun `the ids minted at start are the ids on the written row`() {
    // Children reference these ids before the row exists; end must not re-mint them.
    val recorder = makeRecorder()
    val row = endedRow(recorder)
    assertEquals(recorder.traceId, row.traceId)
    assertEquals(recorder.spanId, row.spanId)
  }

  @Test
  fun `end produces an internal-kind row with the given window`() {
    val row = endedRow(makeRecorder())
    assertEquals("s", row.sessionId)
    assertEquals("checkout", row.name)
    assertEquals(Span.INTERNAL_KIND, row.kind)
    assertEquals(START_MS, row.startTimestampMs)
    assertEquals(END_MS, row.endTimestampMs)
    assertNull(row.statusCode)
    assertNull(row.attributes)
    assertNull(row.events)
  }

  @Test
  fun `end returns the row exactly once`() {
    val recorder = makeRecorder()
    assertTrue(recorder.end(statusCode = null, statusMessage = null, endTimestampMs = END_MS) != null)
    assertNull(recorder.end(statusCode = null, statusMessage = null, endTimestampMs = END_MS + 1))
  }

  @Test
  fun `stores the status code with its message`() {
    val row = endedRow(makeRecorder(), statusCode = Span.STATUS_ERROR, statusMessage = "card declined")
    assertEquals(Span.STATUS_ERROR, row.statusCode)
    assertEquals("card declined", row.statusMessage)
  }

  @Test
  fun `drops a status message that has no status code`() {
    // A message with no code has no OTLP representation.
    val row = endedRow(makeRecorder(), statusCode = null, statusMessage = "orphan")
    assertNull(row.statusMessage)
  }

  @Test
  fun `merges attributes with later writes winning`() {
    val recorder = makeRecorder(attributes = mapOf("cart.items" to 3, "cart.total" to 100))
    recorder.setAttributes(mapOf("cart.total" to 129, "cart.currency" to "USD"))
    val attributes = attributes(endedRow(recorder))
    assertEquals(3, attributes.getInt("cart.items"))
    assertEquals(129, attributes.getInt("cart.total"))
    assertEquals("USD", attributes.getString("cart.currency"))
  }

  @Test
  fun `runs attributes through the log-event validation`() {
    // The reserved `expo.*` namespace is SDK-owned; caller attempts to write into it drop.
    val recorder = makeRecorder(attributes = mapOf("expo.session_id" to "spoof", "cart.items" to 3))
    val attributes = attributes(endedRow(recorder))
    assertTrue(!attributes.has("expo.session_id"))
    assertEquals(3, attributes.getInt("cart.items"))
  }

  @Test
  fun `ignores mutations after the span ended`() {
    val recorder = makeRecorder(attributes = mapOf("cart.items" to 3))
    val row = endedRow(recorder)
    recorder.setAttributes(mapOf("late" to true))
    recorder.addEvent(name = "late-event", attributes = null, timeMs = END_MS)
    assertTrue(!attributes(row).has("late"))
    assertNull(row.events)
  }

  @Test
  fun `encodes events with their timestamps and attributes`() {
    val recorder = makeRecorder()
    recorder.addEvent(name = "cart-validated", attributes = mapOf("items" to 3), timeMs = START_MS + 50)
    recorder.addEvent(name = "payment-authorized", attributes = null, timeMs = START_MS + 200)
    val events = events(endedRow(recorder))
    assertEquals(2, events.length())
    val first = events.getJSONObject(0)
    assertEquals("cart-validated", first.getString("name"))
    assertEquals(START_MS + 50, first.getLong("timeMs"))
    assertEquals(3, first.getJSONObject("attributes").getInt("items"))
    assertTrue(!events.getJSONObject(1).has("attributes"))
  }

  @Test
  fun `drops events whose name trims to empty`() {
    val recorder = makeRecorder()
    recorder.addEvent(name = "  ", attributes = null, timeMs = START_MS)
    recorder.addEvent(name = "kept", attributes = null, timeMs = START_MS)
    val events = events(endedRow(recorder))
    assertEquals(1, events.length())
    assertEquals("kept", events.getJSONObject(0).getString("name"))
  }

  @Test
  fun `caps the number of buffered events`() {
    val recorder = makeRecorder()
    repeat(SpanRecorder.MAX_EVENT_COUNT + 10) { index ->
      recorder.addEvent(name = "event-$index", attributes = null, timeMs = START_MS)
    }
    val events = events(endedRow(recorder))
    assertEquals(SpanRecorder.MAX_EVENT_COUNT, events.length())
    assertEquals("event-0", events.getJSONObject(0).getString("name"))
  }
}

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SpanRecorderDatabaseTest {
  @Test
  fun `a recorded span round-trips through the spans table`() = runTest {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    try {
      database.sessionDao().insert(Session(id = "s", startTimestamp = "2026-08-13T10:00:00.000Z"))
      val recorder = SpanRecorder(
        name = "checkout",
        sessionId = "s",
        attributes = mapOf("cart.items" to 3),
        startTimestampMs = START_MS
      )
      recorder.addEvent(name = "cart-validated", attributes = null, timeMs = START_MS + 50)
      val row = checkNotNull(recorder.end(statusCode = Span.STATUS_OK, statusMessage = null, endTimestampMs = END_MS))
      database.spanDao().insertCapped(row)
      val stored = database.spanDao().getAll().single()
      assertEquals(recorder.traceId, stored.traceId)
      assertEquals(recorder.spanId, stored.spanId)
      assertEquals(Span.INTERNAL_KIND, stored.kind)
      assertEquals(Span.STATUS_OK, stored.statusCode)
      assertTrue(checkNotNull(stored.attributes).contains("cart.items"))
      assertTrue(checkNotNull(stored.events).contains("cart-validated"))
    } finally {
      database.close()
    }
  }
}
