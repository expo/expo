package expo.modules.notifications

import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import expo.modules.notifications.service.delegates.asBase64EncodedObject
import expo.modules.notifications.service.delegates.encodedInBase64
import io.mockk.every
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class NotificationCategorySerializationTest {

  @Before
  fun setup() {
    mockkStatic(android.util.Base64::class)
    every { android.util.Base64.decode(any<String>(), any()) } answers {
      java.util.Base64.getDecoder().decode(firstArg<String>())
    }
    every { android.util.Base64.encodeToString(any(), any()) } answers {
      java.util.Base64.getEncoder().encodeToString(firstArg<ByteArray>())
    }
  }

  @After
  fun tearDown() {
    unmockkStatic(android.util.Base64::class)
  }

  @Test
  fun testDeserializationOfCategoryStoredByNonMinifiedBuild() {
    val stored = "rO0ABXNyAENleHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLm1vZGVsLk5vdGlmaWNhdGlvbkNhdGVnb3J5m6RbIS0kl1kCAAJMAAhtQWN0aW9uc3QAEExqYXZhL3V0aWwvTGlzdDtMAAttSWRlbnRpZmllcnQAEkxqYXZhL2xhbmcvU3RyaW5nO3hwc3IAE2phdmEudXRpbC5BcnJheUxpc3R4gdIdmcdhnQMAAUkABHNpemV4cAAAAAJ3BAAAAAJzcgBBZXhwby5tb2R1bGVzLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy5tb2RlbC5Ob3RpZmljYXRpb25BY3Rpb26tjkni9ymmaQIAA1oAFW1PcGVuc0FwcFRvRm9yZWdyb3VuZEwAC21JZGVudGlmaWVycQB+AAJMAAZtVGl0bGVxAH4AAnhwAHQABGRvbmV0AAREb25lc3IASmV4cG8ubW9kdWxlcy5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMubW9kZWwuVGV4dElucHV0Tm90aWZpY2F0aW9uQWN0aW9uemu1PdbM9d0CAAFMAAxtUGxhY2Vob2xkZXJxAH4AAnhxAH4ABgF0AAVyZXBseXQABVJlcGx5dAAJVHlwZSBoZXJleHQAC2hhYml0LWJ1aWxk"

    assertCategory(stored.asBase64EncodedObject<NotificationCategory>())
  }

  @Test
  fun testSerializationRoundTrip() {
    val stored = createSampleCategory().encodedInBase64()

    assertCategory(stored.asBase64EncodedObject<NotificationCategory>())
  }

  private fun createSampleCategory() = NotificationCategory(
    "habit-build",
    listOf(
      NotificationAction("done", "Done", false),
      TextInputNotificationAction("reply", "Reply", true, "Type here")
    )
  )

  private fun assertCategory(category: NotificationCategory) {
    assertEquals("habit-build", category.identifier)
    assertEquals(2, category.actions.size)

    val done = category.actions[0]
    assertFalse(done is TextInputNotificationAction)
    assertEquals("done", done.identifier)
    assertEquals("Done", done.title)
    assertFalse(done.opensAppToForeground())

    val reply = category.actions[1] as TextInputNotificationAction
    assertEquals("reply", reply.identifier)
    assertEquals("Reply", reply.title)
    assertTrue(reply.opensAppToForeground())
    assertEquals("Type here", reply.placeholder)
  }
}
