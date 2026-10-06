package expo.modules.notifications.tokens

import io.mockk.every
import io.mockk.just
import io.mockk.runs
import io.mockk.spyk
import io.mockk.verify
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PushTokenModuleTest {
  private lateinit var module: PushTokenModule

  @Before
  fun setup() {
    module = spyk(PushTokenModule())
    every { module.sendEvent(any(), any<Map<String, Any?>>()) } just runs
  }

  @Test
  fun `onNewToken emits only one event for two successive calls with the same token`() {
    module.onNewToken("token-a")
    module.onNewToken("token-a")

    verify(exactly = 1) { module.sendEvent("onDevicePushToken", mapOf("devicePushToken" to "token-a")) }
  }

  @Test
  fun `onNewToken emits an event when the token changes`() {
    module.onNewToken("token-a")
    module.onNewToken("token-b")

    verify(exactly = 1) { module.sendEvent("onDevicePushToken", mapOf("devicePushToken" to "token-a")) }
    verify(exactly = 1) { module.sendEvent("onDevicePushToken", mapOf("devicePushToken" to "token-b")) }
  }
}
