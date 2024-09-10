package expo.modules.notifications

import android.app.Notification
import android.content.Context
import android.graphics.Color
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.test.filters.SmallTest
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@SmallTest
class ExpoNotificationBuilderTest {

  private lateinit var context: Context
  private lateinit var notificationBuilder: ExpoNotificationBuilder
  private lateinit var notificationContent: NotificationContent
  private lateinit var notificationRequest: NotificationRequest

  @Before
  fun setup() {
    context = InstrumentationRegistry.getInstrumentation().targetContext

    notificationContent = NotificationContent.Builder()
      .setTitle("Test Title")
      .setSubtitle("Test Subtitle")
      .setText("Test Text")
      .setSticky(true)
      .setColor(Color.RED)
      .setAutoDismiss(true)
      .setSound(Uri.parse("content://media/external/audio/media/123"))
      .setBody(JSONObject("{\"key\":\"value\"}"))
      .setPriority(NotificationPriority.HIGH)
      .setVibrationPattern(longArrayOf(100, 200, 300, 400))
      .build()

    notificationRequest = NotificationRequest("test-1", notificationContent, null)
    val exNotification =
      expo.modules.notifications.notifications.model.Notification(notificationRequest)

    notificationBuilder = ExpoNotificationBuilder(context)
    notificationBuilder.setNotification(exNotification)
  }

  @Test
  fun buildMethodCreatesNotificationWithCorrectProperties() = runBlocking {
    val androidNotification = notificationBuilder.build()

    // Verify the notification properties
    assertNotNull(androidNotification)

    // Check title, text, and subtitle
    assertEquals("Test Title", NotificationCompat.getContentTitle(androidNotification))
    assertEquals("Test Text", NotificationCompat.getContentText(androidNotification))
    assertEquals("Test Subtitle", NotificationCompat.getSubText(androidNotification))
    assertEquals(Color.RED, NotificationCompat.getColor(androidNotification))
    assertTrue(NotificationCompat.getAutoCancel(androidNotification)) // maps to autoDismiss
    assertNull(androidNotification.getLargeIcon()) // in an app this could be a bitmap

    // Check sticky flag
    assertTrue((androidNotification.flags and Notification.FLAG_ONGOING_EVENT) != 0)

    // Check body (JSON data in extras)
    val extras = androidNotification.extras
    assertEquals("{\"key\":\"value\"}", extras.getString(ExpoNotificationBuilder.EXTRAS_BODY_KEY))

    // TODO cover channel later, it should be taken from NotificationTrigger, and override the deprecated fields
    assertNotNull(androidNotification.channelId)
    // deprecated fields, should be taken from channel when available
    assertEquals(NotificationCompat.PRIORITY_HIGH, androidNotification.priority)

    // vibration can be null if controlled by channel
    if (androidNotification.vibrate != null) {
      assertArrayEquals(longArrayOf(100, 200, 300, 400), androidNotification.vibrate)
    }
  }
}
