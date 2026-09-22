package expo.modules.notifications

import expo.modules.notifications.notifications.NotificationSerializer
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NotificationSerializerTest {
  @Test
  fun `JSON nulls are kept as present keys with null values`() {
    val bundle = NotificationSerializer.toBundle(JSONObject("""{"present":"value","absent":null}"""))

    assertEquals("value", bundle.getString("present"))
    assertTrue(bundle.containsKey("absent"))
    assertNull(bundle.getString("absent"))
  }

  @Test
  fun `nested objects and arrays are converted`() {
    val bundle = NotificationSerializer.toBundle(JSONObject("""{"nested":{"a":1},"list":[1,null]}"""))

    assertEquals(1, bundle.getBundle("nested")?.getInt("a"))
    @Suppress("DEPRECATION") // JSON arrays are stored as untyped ArrayLists.
    assertEquals(listOf(1, null), bundle.get("list"))
  }

  @Test
  fun `a null input serializes to null`() {
    assertNull(NotificationSerializer.toBundle(null as JSONObject?))
  }
}
