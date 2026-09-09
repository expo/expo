package expo.modules.notifications

import androidx.core.os.bundleOf
import expo.modules.notifications.notifications.NotificationSerializer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NotificationSerializerTest {
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
