package expo.modules.appmetrics

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class GlobalAttributesTest {
  @Before
  fun resetBefore() {
    GlobalAttributes.set(null)
  }

  @After
  fun resetAfter() {
    GlobalAttributes.set(null)
  }

  @Test
  fun `merged returns event attributes when store is empty`() {
    val merged = GlobalAttributes.mergeWith(mapOf("userId" to "u_42"))
    assertNotNull(merged)
    assertEquals(1, merged!!.size)
    assertEquals("u_42", merged["userId"])
  }

  @Test
  fun `merged returns null when both store and event attributes are empty`() {
    assertNull(GlobalAttributes.mergeWith(null))
  }

  @Test
  fun `set populates the store and merged returns globals`() {
    GlobalAttributes.set(mapOf("tier" to "pro", "variant" to "B"))
    val merged = GlobalAttributes.mergeWith(null)
    assertNotNull(merged)
    assertEquals(2, merged!!.size)
    assertEquals("pro", merged["tier"])
    assertEquals("B", merged["variant"])
  }

  @Test
  fun `merged combines globals and per-event attributes`() {
    GlobalAttributes.set(mapOf("tier" to "pro"))
    val merged = GlobalAttributes.mergeWith(mapOf("screen" to "home"))
    assertNotNull(merged)
    assertEquals(2, merged!!.size)
    assertEquals("pro", merged["tier"])
    assertEquals("home", merged["screen"])
  }

  @Test
  fun `per-event attributes win on key collision`() {
    GlobalAttributes.set(mapOf("tier" to "pro"))
    val merged = GlobalAttributes.mergeWith(mapOf("tier" to "trial"))
    assertNotNull(merged)
    assertEquals(1, merged!!.size)
    assertEquals("trial", merged["tier"])
  }

  @Test
  fun `set replaces the previous store (not merges)`() {
    GlobalAttributes.set(mapOf("tier" to "pro", "variant" to "B"))
    GlobalAttributes.set(mapOf("tier" to "trial"))
    val merged = GlobalAttributes.mergeWith(null)
    assertNotNull(merged)
    assertEquals(1, merged!!.size)
    assertEquals("trial", merged["tier"])
    assertNull(merged["variant"])
  }

  @Test
  fun `set with empty map clears the store`() {
    GlobalAttributes.set(mapOf("tier" to "pro"))
    GlobalAttributes.set(emptyMap())
    assertNull(GlobalAttributes.mergeWith(null))
  }

  @Test
  fun `set with null clears the store`() {
    GlobalAttributes.set(mapOf("tier" to "pro"))
    GlobalAttributes.set(null)
    assertNull(GlobalAttributes.mergeWith(null))
  }

  @Test
  fun `set sanitizes reserved keys before storing`() {
    GlobalAttributes.set(
      mapOf(
        "expo.app.name" to "spoofed",
        "session.id" to "spoofed",
        "tier" to "pro"
      )
    )
    val merged = GlobalAttributes.mergeWith(null)
    assertNotNull(merged)
    assertEquals(1, merged!!.size)
    assertEquals("pro", merged["tier"])
  }
}
