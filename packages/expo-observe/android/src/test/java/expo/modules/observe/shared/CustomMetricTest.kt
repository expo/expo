package expo.modules.observe.shared

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CustomMetricTest {
  private fun metric(
    name: String = "checkout.payment_time",
    value: Double = 1.0,
    unit: String? = null,
    attributes: Map<String, Any?>? = null
  ) = customMetric(
    sessionId = "session",
    name = name,
    value = value,
    unit = unit,
    attributes = attributes
  )

  @Test
  fun `builds a custom metric from valid input`() {
    val metric = metric(
      name = " checkout.payment_time ",
      value = 1.5,
      unit = "s",
      attributes = mapOf("method" to "card")
    )
    assertNotNull(metric)
    assertEquals("session", metric!!.sessionId)
    assertEquals(MetricCategory.Custom.categoryName, metric.category)
    assertEquals("checkout.payment_time", metric.name)
    assertEquals(1.5, metric.value, 0.0)
    assertEquals("s", metric.unit)
    assertEquals("card", JSONObject(metric.params!!).getString("method"))
  }

  @Test
  fun `accepts a name of 255 characters`() {
    assertNotNull(metric(name = "a".repeat(255)))
  }

  @Test
  fun `drops a metric whose name is not valid`() {
    listOf("", "1st.metric", "checkout time", "checkout:time", "a".repeat(256)).forEach { name ->
      assertNull("name: $name", metric(name = name))
    }
  }

  @Test
  fun `drops a metric in the reserved expo namespace`() {
    assertNull(metric(name = "expo.app_startup.tti"))
  }

  @Test
  fun `drops a metric whose value is not finite`() {
    listOf(Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY).forEach { value ->
      assertNull("value: $value", metric(value = value))
    }
  }

  @Test
  fun `keeps the metric but drops a unit that is empty or not valid`() {
    listOf("", "milli seconds", "µs", "x".repeat(64)).forEach { unit ->
      val metric = metric(unit = unit)
      assertNotNull("unit: $unit", metric)
      assertNull("unit: $unit", metric!!.unit)
    }
  }

  @Test
  fun `drops reserved attribute keys`() {
    val metric = metric(attributes = mapOf("expo.route" to "/", "step" to 2))
    val params = JSONObject(metric!!.params!!)
    assertFalse(params.has("expo.route"))
    assertEquals(2, params.getInt("step"))
  }
}
