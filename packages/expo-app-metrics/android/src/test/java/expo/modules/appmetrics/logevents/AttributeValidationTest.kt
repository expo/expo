package expo.modules.appmetrics.logevents

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class AttributeValidationTest {
  @Test
  fun `returns null when input is null`() {
    val result = sanitizeLogEventAttributes(null)
    assertNull(result.attributes)
    assertEquals(0, result.droppedCount)
  }

  @Test
  fun `passes through normal attributes unchanged`() {
    val result = sanitizeLogEventAttributes(mapOf("userId" to "u_42", "attempt" to 2))
    assertEquals(0, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals(2, attributes.size)
    assertEquals("u_42", attributes["userId"])
    assertEquals(2, attributes["attempt"])
  }

  @Test
  fun `trims whitespace from valid keys`() {
    val result = sanitizeLogEventAttributes(mapOf("  userId  " to "u_42"))
    assertEquals(0, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals("u_42", attributes["userId"])
    assertNull(attributes["  userId  "])
  }

  @Test
  fun `drops empty and whitespace-only keys`() {
    val result = sanitizeLogEventAttributes(
      mapOf("" to "x", "   " to "y", "valid" to "z")
    )
    assertEquals(2, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals(1, attributes.size)
    assertEquals("z", attributes["valid"])
  }

  @Test
  fun `drops keys under the reserved expo namespace`() {
    val result = sanitizeLogEventAttributes(
      mapOf(
        "expo.app.name" to "spoofed",
        "expo.eas_client.id" to "spoofed",
        "userId" to "u_42"
      )
    )
    assertEquals(2, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals(1, attributes.size)
    assertEquals("u_42", attributes["userId"])
  }

  @Test
  fun `drops SDK-set OTel keys (event_name and session_id)`() {
    val result = sanitizeLogEventAttributes(
      mapOf(
        "event.name" to "spoofed",
        "session.id" to "spoofed",
        "ok" to true
      )
    )
    assertEquals(2, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals(1, attributes.size)
    assertEquals(true, attributes["ok"])
  }

  @Test
  fun `applies reserved-prefix check after trimming whitespace`() {
    val result = sanitizeLogEventAttributes(mapOf("  expo.foo  " to "x"))
    assertEquals(1, result.droppedCount)
    assertNull(result.attributes)
  }

  @Test
  fun `applies SDK-set check after trimming whitespace`() {
    val result = sanitizeLogEventAttributes(mapOf("  event.name  " to "x"))
    assertEquals(1, result.droppedCount)
    assertNull(result.attributes)
  }

  @Test
  fun `does not match keys that merely start with a reserved word but aren't the namespace`() {
    val result = sanitizeLogEventAttributes(
      mapOf(
        "expoFoo" to "ok",
        "expo" to "ok",
        "session.idx" to "ok",
        "event.name.extra" to "ok"
      )
    )
    assertEquals(0, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals(4, attributes.size)
  }

  @Test
  fun `caps attributes at 128 entries and reports the overflow`() {
    val input = LinkedHashMap<String, Any?>()
    for (i in 0 until 200) {
      // Pad keys so sort order is deterministic and predictable.
      input[String.format("k%03d", i)] = i
    }
    val result = sanitizeLogEventAttributes(input)
    assertEquals(72, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals(128, attributes.size)
    // Sorted-ascending kept set means the first 128 keys (k000…k127) survive.
    assertEquals(0, attributes["k000"])
    assertEquals(127, attributes["k127"])
    assertNull(attributes["k128"])
  }

  @Test
  fun `returns null attributes when every entry is dropped`() {
    val result = sanitizeLogEventAttributes(
      mapOf("expo.foo" to "x", "expo.bar" to "y")
    )
    assertNull(result.attributes)
    assertEquals(2, result.droppedCount)
  }

  @Test
  fun `combines multiple drop categories in the count`() {
    val result = sanitizeLogEventAttributes(
      mapOf(
        "" to "empty-key-drop",
        "expo.foo" to "namespace-drop",
        "session.id" to "sdk-drop",
        "valid" to "ok"
      )
    )
    assertEquals(3, result.droppedCount)
    val attributes = result.attributes!!
    assertEquals(1, attributes.size)
    assertEquals("ok", attributes["valid"])
  }
}
