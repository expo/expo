package expo.modules.notifications

import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.RemoteMessageSerializer
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class RemoteMessageSerializerTest {
  @Test
  fun `dataString is derived from the body entry`() {
    val data = RemoteMessageSerializer.toBundle(messageWith(mapOf("body" to """{"a":1}""")))
      .getBundle("data")

    assertEquals("""{"a":1}""", data?.getString("dataString"))
  }

  @Test
  fun `a dataString data entry does not overwrite the derived value`() {
    val data = RemoteMessageSerializer.toBundle(
      messageWith(mapOf("body" to """{"a":1}""", "dataString" to "from the payload"))
    ).getBundle("data")

    assertEquals("""{"a":1}""", data?.getString("dataString"))
  }

  @Test
  fun `other data entries are copied as is`() {
    val data = RemoteMessageSerializer.toBundle(messageWith(mapOf("custom" to "value")))
      .getBundle("data")

    assertEquals("value", data?.getString("custom"))
  }

  private fun messageWith(data: Map<String, String>) =
    RemoteMessage.Builder("expo@fcm.googleapis.com")
      .also { builder -> data.forEach { (key, value) -> builder.addData(key, value) } }
      .build()
}
