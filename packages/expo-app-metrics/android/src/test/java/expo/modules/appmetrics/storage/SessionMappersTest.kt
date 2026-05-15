package expo.modules.appmetrics.storage

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SessionMappersTest {
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
  fun `JsMetric_fromMetric copies scalar fields verbatim and drops sessionId`() {
    val js = JsMetric.fromMetric(makeMetric(metricId = "m-42", sessionId = "session-1"))

    assertEquals("m-42", js.metricId)
    assertEquals("appStartup", js.category)
    assertEquals("timeToInteractive", js.name)
    assertEquals(1.5, js.value, 0.0)
    assertEquals("2025-01-01T00:00:01.000Z", js.timestamp)
    // sessionId is intentionally absent from the JS-facing shape — the owning
    // session is implicit on every output path (the `Session` shared object
    // for `getMetrics()`, the `getStoredEntries` payload that doesn't carry
    // it on the wire either).
  }

  @Test
  fun `JsMetric_toMetric copies scalar fields and leaves sessionId empty for the caller to stamp`() {
    val input = JsMetric(
      category = "user",
      name = "tap",
      value = 1.0,
      metricId = "m-input",
      timestamp = "2025-01-01T00:00:00.000Z"
    )

    val entity = input.toMetric()

    assertEquals("m-input", entity.metricId)
    // SessionManager.addMetrics / addMetricToSession stamps the sessionId via
    // `.copy()` at insert time — JS doesn't carry it on the wire.
    assertEquals("", entity.sessionId)
    assertEquals("user", entity.category)
    assertEquals("tap", entity.name)
  }

  @Test
  fun `JsMetric_toMetric generates a fresh metricId when none is provided`() {
    val input = JsMetric(
      category = "user",
      name = "tap",
      value = 1.0,
      timestamp = "2025-01-01T00:00:00.000Z"
    )

    val first = input.toMetric()
    val second = input.toMetric()

    assertNotNull(first.metricId)
    assertNotEquals("metric ids must be unique per call when caller omits one", first.metricId, second.metricId)
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
