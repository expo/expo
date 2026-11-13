package expo.modules.appmetrics.logevents

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class EventBodyValidationTest {
  @Test
  fun `returns null when input is null`() {
    assertNull(validateEventBody(null))
  }

  @Test
  fun `passes through a short body unchanged`() {
    assertEquals("hello", validateEventBody("hello"))
  }

  @Test
  fun `passes through a body exactly at the cap`() {
    val atLimit = "a".repeat(4096)
    assertEquals(atLimit, validateEventBody(atLimit))
  }

  @Test
  fun `truncates a body just past the cap`() {
    val oversized = "a".repeat(4097)
    val result = validateEventBody(oversized)!!
    assertEquals(4096, result.length)
    assertTrue(result.endsWith("…"))
  }

  @Test
  fun `truncates a long body and appends the ellipsis`() {
    val oversized = "x".repeat(10_000)
    val result = validateEventBody(oversized)!!
    assertEquals(4096, result.length)
    assertTrue(result.endsWith("…"))
    // Prefix is preserved (start of the original body survives).
    assertTrue(result.startsWith("xxxx"))
  }

  @Test
  fun `passes through an empty body`() {
    assertEquals("", validateEventBody(""))
  }
}
