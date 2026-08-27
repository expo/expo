package expo.modules.notifications

import androidx.core.os.bundleOf
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

  private fun serializedContent(extras: android.os.Bundle): android.os.Bundle =
    NotificationSerializer.toResponseBundleFromExtras(extras)
      .getBundle("notification")!!
      .getBundle("request")!!
      .getBundle("content")!!

  @Test
  fun `toResponseBundleFromExtras passes threadIdentifier through`() {
    val content = serializedContent(bundleOf("title" to "t", "threadIdentifier" to "thread-1"))
    assertEquals("thread-1", content.getString("threadIdentifier"))
  }

  @Test
  fun `toResponseBundleFromExtras normalizes empty threadIdentifier to null`() {
    val content = serializedContent(bundleOf("title" to "t", "threadIdentifier" to ""))
    assertNull(content.getString("threadIdentifier"))
  }

  @Test
  fun `toResponseBundleFromExtras emits null threadIdentifier when absent`() {
    val content = serializedContent(bundleOf("title" to "t"))
    assertNull(content.getString("threadIdentifier"))
  }
}
