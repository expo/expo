package expo.modules.appmetrics.sessions

import expo.modules.appmetrics.utils.JsonAny
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SessionInputsTest {
  @Test
  fun `SessionMetricInput_toMetric maps scalar fields verbatim`() {
    val input = SessionMetricInput(
      category = "custom",
      name = "purchase",
      value = 9.99,
      timestamp = "2025-03-01T12:00:00.000Z",
      routeName = "Checkout"
    )

    val metric = input.toMetric()

    assertEquals("custom", metric.category)
    assertEquals("purchase", metric.name)
    assertEquals(9.99, metric.value, 0.0)
    assertEquals("2025-03-01T12:00:00.000Z", metric.timestamp)
    assertEquals("Checkout", metric.routeName)
    assertNull(metric.updateId)
  }

  @Test
  fun `SessionMetricInput_toMetric JSON-encodes params`() {
    val input = SessionMetricInput(
      category = "custom",
      name = "purchase",
      value = 1.0,
      params = mapOf("screen" to "Home", "attempt" to 3, "flag" to true)
    )

    val metric = input.toMetric()

    // Round-trip through the JSON decoder to assert the encoding is valid.
    val decoded = JsonAny.decodeJsonStringToMap(metric.params!!)
    assertEquals("Home", decoded?.get("screen"))
    assertEquals(3L, decoded?.get("attempt"))
    assertEquals(true, decoded?.get("flag"))
  }

  @Test
  fun `SessionMetricInput_toMetric yields null params when none provided`() {
    val input = SessionMetricInput(category = "custom", name = "purchase", value = 1.0)

    val metric = input.toMetric()

    assertNull(metric.params)
  }
}
