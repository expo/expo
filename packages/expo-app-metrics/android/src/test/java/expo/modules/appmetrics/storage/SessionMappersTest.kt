package expo.modules.appmetrics.storage

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
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

  @Test
  fun `toJsSession exposes the JS-facing field names`() {
    val swm = SessionWithMetrics(
      session = makeSession(id = "abc", startTimestamp = "2025-06-15T10:00:00.000Z"),
      metrics = emptyList()
    )

    val js = swm.toJsSession()

    assertEquals("abc", js["id"])
    assertEquals("main", js["type"])
    assertEquals("2025-06-15T10:00:00.000Z", js["startDate"])
    assertNull(js["endDate"])
    assertEquals(emptyList<Any>(), js["metrics"])
  }

  @Test
  fun `toJsSession surfaces endDate when set`() {
    val swm = SessionWithMetrics(
      session = makeSession(endTimestamp = "2025-01-02T00:00:00.000Z"),
      metrics = emptyList()
    )

    val js = swm.toJsSession()

    assertEquals("2025-01-02T00:00:00.000Z", js["endDate"])
  }

  @Test
  fun `toJsSession decodes Metric_params from JSON`() {
    val swm = SessionWithMetrics(
      session = makeSession(),
      metrics = listOf(
        makeMetric(params = """{"screen":"Home","attempt":3,"flag":true}""")
      )
    )

    @Suppress("UNCHECKED_CAST")
    val metrics = swm.toJsSession()["metrics"] as List<Map<String, Any?>>
    assertEquals(1, metrics.size)

    @Suppress("UNCHECKED_CAST")
    val params = metrics.single()["params"] as Map<String, Any?>
    assertEquals("Home", params["screen"])
    assertEquals(3L, params["attempt"])
    assertEquals(true, params["flag"])
  }

  @Test
  fun `toJsSession yields null params when storage column is null`() {
    val swm = SessionWithMetrics(
      session = makeSession(),
      metrics = listOf(makeMetric(params = null))
    )

    @Suppress("UNCHECKED_CAST")
    val metrics = swm.toJsSession()["metrics"] as List<Map<String, Any?>>
    assertNull(metrics.single()["params"])
  }

  @Test
  fun `toJsSession yields null params when storage column is malformed JSON`() {
    val swm = SessionWithMetrics(
      session = makeSession(),
      metrics = listOf(makeMetric(params = "{ this is not valid json"))
    )

    @Suppress("UNCHECKED_CAST")
    val metrics = swm.toJsSession()["metrics"] as List<Map<String, Any?>>
    assertNull(metrics.single()["params"])
  }

  @Test
  fun `toJsSession copies metric scalar fields verbatim`() {
    val swm = SessionWithMetrics(
      session = makeSession(),
      metrics = listOf(
        makeMetric(metricId = "m-42", sessionId = "session-1")
      )
    )

    @Suppress("UNCHECKED_CAST")
    val metric = (swm.toJsSession()["metrics"] as List<Map<String, Any?>>).single()
    assertEquals("m-42", metric["metricId"])
    assertEquals("session-1", metric["sessionId"])
    assertEquals("appStartup", metric["category"])
    assertEquals("timeToInteractive", metric["name"])
    assertEquals(1.5, metric["value"])
    assertEquals("2025-01-01T00:00:01.000Z", metric["timestamp"])
    assertTrue("metricId key should be present", metric.containsKey("metricId"))
  }
}
