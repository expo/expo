package expo.modules.appmetrics.logevents

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class EventNameValidationTest {
  @Test
  fun `accepts a regular name and returns it unchanged`() {
    assertEquals("auth.login_failed", validateEventName("auth.login_failed"))
  }

  @Test
  fun `trims surrounding whitespace`() {
    assertEquals("user.signed_in", validateEventName("  user.signed_in\n"))
  }

  @Test
  fun `rejects an empty name`() {
    assertNull(validateEventName(""))
  }

  @Test
  fun `rejects a whitespace-only name`() {
    assertNull(validateEventName("   \t\n"))
  }

  @Test
  fun `rejects names that use the reserved expo prefix`() {
    assertNull(validateEventName("expo.app_startup.tti"))
    assertNull(validateEventName("expo.something"))
  }

  @Test
  fun `accepts names containing 'expo' as long as it isn't the prefix`() {
    assertEquals("my_expo.event", validateEventName("my_expo.event"))
    assertEquals("app.expo.thing", validateEventName("app.expo.thing"))
  }

  @Test
  fun `rejects names longer than the cap`() {
    val oversized = "a".repeat(257)
    assertNull(validateEventName(oversized))
  }

  @Test
  fun `accepts names exactly at the cap`() {
    val atLimit = "a".repeat(256)
    assertEquals(atLimit, validateEventName(atLimit))
  }
}
