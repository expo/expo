package expo.modules.notifications.notifications.model

import android.app.Notification
import android.content.Context
import android.graphics.Color
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.test.filters.SmallTest
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.interfaces.INotificationContent
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@SmallTest
class ExpoNotificationBuilderTest {

  private lateinit var context: Context
  private lateinit var categoriesStore: SharedPreferencesNotificationCategoriesStore

  @Before
  fun setup() {
    context = InstrumentationRegistry.getInstrumentation().targetContext
    categoriesStore = SharedPreferencesNotificationCategoriesStore(context)
    val na = NotificationAction("test-action", "Test Action", true)
    val nc = NotificationCategory("test-category", listOf(na))
    categoriesStore.saveNotificationCategory(nc)
  }

  private fun createTestNotificationBuilder(notificationContent: INotificationContent): ExpoNotificationBuilder {
    val notificationRequest = NotificationRequest("test-1", notificationContent, null)
    val exNotification =
      Notification(notificationRequest)

    return ExpoNotificationBuilder(context, exNotification, categoriesStore)
  }

  private fun assertIsSilent(notification: Notification) {
    // Verifying sound is a bit tricky because of channels; so we use this "proxy"
    assertTrue("Notification should not be silent", notification.group == "silent")
  }

  private fun assertIsNotSilent(notification: Notification) {
    // Verifying sound is a bit tricky because of channels; so we use this "proxy"
    assertTrue("Notification should not be silent", notification.group == null)
  }

  @Test
  fun buildMethodCreatesNotificationWithCorrectProperties() = runBlocking {
    val notificationContent = NotificationContent.Builder()
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
      .setCategoryId("test-category")
      .setBadgeCount(999)
      .build()
    val androidNotification = createTestNotificationBuilder(notificationContent).build()

    // Verify the notification properties
    assertNotNull(androidNotification)

    // Check title, text, and subtitle
    assertEquals(notificationContent.title, NotificationCompat.getContentTitle(androidNotification))
    assertEquals(notificationContent.text, NotificationCompat.getContentText(androidNotification))
    assertEquals(notificationContent.subText, NotificationCompat.getSubText(androidNotification))
    assertEquals(notificationContent.color, NotificationCompat.getColor(androidNotification))
    assertEquals(notificationContent.isAutoDismiss, NotificationCompat.getAutoCancel(androidNotification))
    assertNull(androidNotification.getLargeIcon()) // in an app this could be a bitmap
    val action = androidNotification.actions.first()
    assertEquals("Test Action", action.title)
    assertEquals(notificationContent.badgeCount, androidNotification.number)

    // Check sticky flag
    assertTrue((androidNotification.flags and Notification.FLAG_ONGOING_EVENT) != 0)

    // Check body (JSON data in extras)
    val extras = androidNotification.extras
    assertEquals("{\"key\":\"value\"}", extras.getString(ExpoNotificationBuilder.EXTRAS_BODY_KEY))

    assertEquals(androidNotification.channelId, "expo_notifications_fallback_notification_channel")
    // deprecated fields, should be taken from channel when available
    assertEquals(NotificationCompat.PRIORITY_HIGH, androidNotification.priority)

    // vibration can be null if controlled by channel
    if (androidNotification.vibrate != null) {
      assertArrayEquals(longArrayOf(100, 200, 300, 400), androidNotification.vibrate)
    }
    assertIsNotSilent(androidNotification)
  }

  @Test
  fun buildMethodCreatesEmptyNotification() = runBlocking {
    val notificationContent = NotificationContent.Builder().build()
    val androidNotification = createTestNotificationBuilder(notificationContent).build()

    // Verify the notification properties
    assertNotNull(androidNotification)
    assertNull(NotificationCompat.getContentTitle(androidNotification))
    assertNull(NotificationCompat.getContentText(androidNotification))
    assertNull(NotificationCompat.getSubText(androidNotification))
    assertEquals(NotificationCompat.getColor(androidNotification), 0)
    assertFalse(NotificationCompat.getAutoCancel(androidNotification))
    assertNull(androidNotification.getLargeIcon())
    assertEquals(androidNotification.channelId, "expo_notifications_fallback_notification_channel")
    assertNull(androidNotification.actions)
    assertEquals(androidNotification.number, 0)
    assertIsNotSilent(androidNotification)
  }

  @Test
  fun customSoundAndDisabledVibrationAreNotSilent() = runBlocking {
    val notificationContent = NotificationContent.Builder()
      .setSound(Uri.parse("content://media/external/audio/media/123"))
      .disableVibrations()
      .build()
    val androidNotification = createTestNotificationBuilder(notificationContent).build()

    assertIsNotSilent(androidNotification)
  }

  @Test
  fun disablingSoundAndVibrationsTurnsNotificationIntoSilent() = runBlocking {
    val notificationContent = NotificationContent.Builder()
      .setSound(null)
      .disableVibrations()
      .build()
    val androidNotification = createTestNotificationBuilder(notificationContent).build()

    assertIsSilent(androidNotification)
  }
}
