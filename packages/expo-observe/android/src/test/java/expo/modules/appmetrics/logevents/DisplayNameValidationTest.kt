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
class DisplayNameValidationTest {
  @Test
  fun `returns null when input is null`() {
    assertNull(validateDisplayName(null))
  }

  @Test
  fun `passes through a short display name unchanged`() {
    assertEquals("Login failed", validateDisplayName("Login failed"))
  }

  @Test
  fun `trims surrounding whitespace`() {
    assertEquals("Login failed", validateDisplayName("  Login failed\n"))
  }

  @Test
  fun `returns null for an empty display name`() {
    assertNull(validateDisplayName(""))
  }

  @Test
  fun `returns null for a whitespace-only display name`() {
    assertNull(validateDisplayName("   \t\n"))
  }

  @Test
  fun `passes through a display name exactly at the cap`() {
    val atLimit = "a".repeat(128)
    assertEquals(atLimit, validateDisplayName(atLimit))
  }

  @Test
  fun `truncates a display name just past the cap`() {
    val oversized = "a".repeat(129)
    val result = validateDisplayName(oversized)!!
    assertEquals(128, result.length)
    assertTrue(result.endsWith("…"))
  }
}
