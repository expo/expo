package expo.modules.appmetrics.storage

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SessionMappersTest {
  private fun makeSession(
    id: String = "session-1",
    startTimestamp: String = "2025-01-01T00:00:00.000Z",
    endTimestamp: String? = null
  ): Session = Session(
    id = id,
    startTimestamp = startTimestamp,
    endTimestamp = endTimestamp,
    isActive = endTimestamp == null
  )

  private fun makeMetric(
    metricId: String = "metric-1",
    sessionId: String = "session-1",
    params: String? = null
  ): Metric = Metric(
    metricId = metricId,
    sessionId = sessionId,
    timestamp = "2025-01-01T00:00:01.000Z",
    category = "appStartup",
    name = "timeToInteractive",
    value = 1.5,
    params = params
  )

  private fun makeLog(
    logId: String = "log-1",
    sessionId: String = "session-1",
    name: String = "auth.login_failed",
    attributes: String? = null
  ): LogRecord = LogRecord(
    logId = logId,
    sessionId = sessionId,
    timestamp = "2025-01-01T00:00:02.000Z",
    name = name,
    body = "invalid_credentials",
    severity = "warn",
    attributes = attributes
  )

  @Test
  fun `JsSession_fromSessionWithMetrics exposes the JS-facing field names`() {
    val swm = SessionWithMetrics(
      session = makeSession(id = "abc", startTimestamp = "2025-06-15T10:00:00.000Z"),
      metrics = emptyList()
    )

    val js = JsSession.fromSessionWithMetrics(swm)

    assertEquals("abc", js.id)
    assertEquals("main", js.type)
    assertEquals("2025-06-15T10:00:00.000Z", js.startDate)
    assertNull(js.endDate)
    assertEquals(emptyList<JsMetric>(), js.metrics)
  }

  @Test
  fun `JsSession_fromSessionWithMetrics surfaces endDate when set`() {
    val swm = SessionWithMetrics(
      session = makeSession(endTimestamp = "2025-01-02T00:00:00.000Z"),
      metrics = emptyList()
    )

    val js = JsSession.fromSessionWithMetrics(swm)

    assertEquals("2025-01-02T00:00:00.000Z", js.endDate)
  }

  @Test
  fun `JsMetric_fromMetric decodes params from JSON`() {
    val metric = makeMetric(params = """{"screen":"Home","attempt":3,"flag":true}""")

    val js = JsMetric.fromMetric(metric)

    val params = js.params
    assertEquals("Home", params?.get("screen"))
    assertEquals(3L, params?.get("attempt"))
    assertEquals(true, params?.get("flag"))
  }

  @Test
  fun `JsMetric_fromMetric yields null params when storage column is null`() {
    val js = JsMetric.fromMetric(makeMetric(params = null))

    assertNull(js.params)
  }

  @Test
  fun `JsMetric_fromMetric yields null params when storage column is malformed JSON`() {
    val js = JsMetric.fromMetric(makeMetric(params = "{ this is not valid json"))

    assertNull(js.params)
  }

  @Test
  fun `JsMetric_fromMetric copies scalar fields verbatim`() {
    val js = JsMetric.fromMetric(makeMetric(metricId = "m-42", sessionId = "session-1"))

    assertEquals("m-42", js.metricId)
    assertEquals("session-1", js.sessionId)
    assertEquals("appStartup", js.category)
    assertEquals("timeToInteractive", js.name)
    assertEquals(1.5, js.value, 0.0)
    assertEquals("2025-01-01T00:00:01.000Z", js.timestamp)
  }

  @Test
  fun `JsSession_fromSessionWithMetrics surfaces stored logs`() {
    val swm = SessionWithMetrics(
      session = makeSession(),
      metrics = emptyList(),
      logs = listOf(
        makeLog(logId = "l-1", name = "first.event"),
        makeLog(logId = "l-2", name = "second.event")
      )
    )

    val js = JsSession.fromSessionWithMetrics(swm)

    assertEquals(2, js.logs.size)
    assertEquals("first.event", js.logs[0].name)
    assertEquals("second.event", js.logs[1].name)
  }

  @Test
  fun `JsLogRecord_fromLogRecord decodes attributes from JSON`() {
    val log = makeLog(attributes = """{"userId":"u_42","attempt":2,"retry":true}""")

    val js = JsLogRecord.fromLogRecord(log)

    val attributes = js.attributes
    assertEquals("u_42", attributes?.get("userId"))
    assertEquals(2L, attributes?.get("attempt"))
    assertEquals(true, attributes?.get("retry"))
  }

  @Test
  fun `JsLogRecord_fromLogRecord yields null attributes when storage column is null`() {
    val js = JsLogRecord.fromLogRecord(makeLog(attributes = null))

    assertNull(js.attributes)
  }

  @Test
  fun `JsLogRecord_fromLogRecord yields null attributes when storage column is malformed JSON`() {
    val js = JsLogRecord.fromLogRecord(makeLog(attributes = "{ this is not valid json"))

    assertNull(js.attributes)
  }

  @Test
  fun `JsLogRecord_fromLogRecord copies scalar fields verbatim`() {
    val js = JsLogRecord.fromLogRecord(makeLog())

    assertEquals("auth.login_failed", js.name)
    assertEquals("invalid_credentials", js.body)
    assertEquals("warn", js.severity)
    assertEquals("2025-01-01T00:00:02.000Z", js.timestamp)
  }

  @Test
  fun `JsLogRecord and JsMetric decode nested JSON objects identically`() {
    // The shared `decodeJsonObject` helper handles both `params` and
    // `attributes`. This test pins down behavior for a non-trivial nested
    // payload so the two callers can't quietly drift.
    val payload = """{"user":{"id":"u_42","prefs":{"theme":"dark"}},"tags":["a","b"]}"""

    val metricResult = JsMetric.fromMetric(makeMetric(params = payload)).params
    val logResult = JsLogRecord.fromLogRecord(makeLog(attributes = payload)).attributes

    // Both should decode the nested user object the same way.
    @Suppress("UNCHECKED_CAST")
    val metricUser = metricResult?.get("user") as? Map<String, Any?>
    @Suppress("UNCHECKED_CAST")
    val logUser = logResult?.get("user") as? Map<String, Any?>
    assertEquals(metricUser, logUser)
    assertEquals("u_42", metricUser?.get("id"))

    @Suppress("UNCHECKED_CAST")
    val prefs = metricUser?.get("prefs") as? Map<String, Any?>
    assertEquals("dark", prefs?.get("theme"))

    // And arrays decode identically too.
    assertEquals(listOf("a", "b"), metricResult?.get("tags"))
    assertEquals(metricResult?.get("tags"), logResult?.get("tags"))
  }
}
