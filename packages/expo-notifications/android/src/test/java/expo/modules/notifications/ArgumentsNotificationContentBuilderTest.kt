package expo.modules.notifications

import androidx.test.core.app.ApplicationProvider
import expo.modules.core.arguments.MapArguments
import expo.modules.notifications.notifications.ArgumentsNotificationContentBuilder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ArgumentsNotificationContentBuilderTest {
  private val context = ApplicationProvider.getApplicationContext<android.content.Context>()

  private fun buildContent(payload: Map<String, Any>) =
    ArgumentsNotificationContentBuilder(context).setPayload(MapArguments(payload)).build()

  @Test
  fun `threadIdentifier maps to group`() {
    assertEquals("thread-1", buildContent(mapOf("threadIdentifier" to "thread-1")).group)
  }

  @Test
  fun `missing threadIdentifier maps to null group`() {
    assertNull(buildContent(emptyMap()).group)
  }

  @Test
  fun `empty threadIdentifier maps to null group`() {
    assertNull(buildContent(mapOf("threadIdentifier" to "")).group)
  }
}
