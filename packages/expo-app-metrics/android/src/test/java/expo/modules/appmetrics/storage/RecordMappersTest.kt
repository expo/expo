package expo.modules.appmetrics.storage

import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class RecordMappersTest {
  @Test
  fun `MetricRecord_toEntity copies every field and sets the sessionId`() {
    val record = MetricRecord(
      timestamp = "2025-01-01T00:00:00.000Z",
      category = "appStartup",
      name = "coldLaunchTime",
      value = 1.5,
      routeName = "Home",
      updateId = "update-1",
      params = """{"a":1}"""
    )

    assertEquals(
      Metric(
        sessionId = "session-1",
        timestamp = "2025-01-01T00:00:00.000Z",
        category = "appStartup",
        name = "coldLaunchTime",
        value = 1.5,
        routeName = "Home",
        updateId = "update-1",
        params = """{"a":1}"""
      ),
      record.toEntity("session-1")
    )
  }

  @Test
  fun `LogEvent_toEntity copies every field and sets the sessionId`() {
    val event = LogEvent(
      timestamp = "2025-01-01T00:00:00.000Z",
      name = "user.signed_in",
      body = "body",
      severity = "info",
      attributes = """{"a":1}""",
      droppedAttributesCount = 2
    )

    assertEquals(
      LogRecord(
        sessionId = "session-1",
        timestamp = "2025-01-01T00:00:00.000Z",
        name = "user.signed_in",
        body = "body",
        severity = "info",
        attributes = """{"a":1}""",
        droppedAttributesCount = 2
      ),
      event.toEntity("session-1")
    )
  }

  @Test
  fun `NetworkSpan_toEntity copies every field, sets the sessionId, and generates ids`() {
    val networkSpan = NetworkSpan(
      name = "GET",
      kind = NetworkSpan.CLIENT_KIND,
      startTimestampMs = 1_000,
      endTimestampMs = 1_250,
      statusCode = NetworkSpan.STATUS_ERROR,
      statusMessage = "failed",
      attributes = """{"a":1}""",
      events = "[]"
    )

    val span = networkSpan.toEntity("session-1")

    assertEquals(
      Span(
        sessionId = "session-1",
        traceId = span.traceId,
        spanId = span.spanId,
        name = "GET",
        kind = NetworkSpan.CLIENT_KIND,
        startTimestampMs = 1_000,
        endTimestampMs = 1_250,
        statusCode = NetworkSpan.STATUS_ERROR,
        statusMessage = "failed",
        attributes = """{"a":1}""",
        events = "[]"
      ),
      span
    )
    assertEquals(32, span.traceId.length)
    assertEquals(16, span.spanId.length)
    assertNotEquals(span.traceId, networkSpan.toEntity("session-1").traceId)
  }
}
