package expo.modules.observe.shared.utils

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// `AppMetrics.host` is process-wide and set once, so the write-once rule is tested on its own
// instances instead.
class WriteOnceTest {
  @Test
  fun `returns the set value`() {
    val value = WriteOnce("initial")
    assertTrue(value.set("configured"))
    assertEquals("configured", value.value)
  }

  @Test
  fun `ignores a second set`() {
    val value = WriteOnce("initial")
    assertTrue(value.set("first"))
    assertFalse(value.set("second"))
    assertEquals("first", value.value)
  }

  @Test
  fun `a read before the set does not block the set`() {
    val value = WriteOnce("initial")
    assertEquals("initial", value.value)
    assertTrue(value.set("late"))
    assertEquals("late", value.value)
  }
}
