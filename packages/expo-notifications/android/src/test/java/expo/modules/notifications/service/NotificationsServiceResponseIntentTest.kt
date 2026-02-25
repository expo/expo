package expo.modules.notifications.service

import android.content.Intent
import android.os.Parcel
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NotificationsServiceResponseIntentTest {

  private val context get() = ApplicationProvider.getApplicationContext<android.app.Application>()

  /**
   * Builds a Notification that can survive Parcel marshal/unmarshal round-trips.
   */
  private fun buildNotification(identifier: String = "test-id"): Notification {
    return Notification(
      NotificationRequest(
        identifier,
        NotificationContent.Builder().setTitle("Title").setText("Body").build(),
        null
      )
    )
  }

  private fun buildAction(identifier: String = "default"): NotificationAction {
    return NotificationAction(identifier, "Open", true)
  }

  /**
   * Simulates the Android 11/12 bug where custom Parcelable extras come back as null
   * from a PendingIntent, but byte array extras survive. Verifies that
   * createNotificationResponseBroadcastIntent falls back to byte arrays.
   * See https://github.com/expo/expo/issues/38908
   */
  @Test
  fun `createNotificationResponseBroadcastIntent falls back to byte arrays when Parcelable extras are null`() {
    val notification = buildNotification(identifier = "byte-array-test")
    val action = buildAction()

    val intent = Intent().apply {
      putExtra(NotificationsService.NOTIFICATION_BYTES_KEY, marshalParcelable(notification))
      putExtra(NotificationsService.NOTIFICATION_ACTION_BYTES_KEY, marshalParcelable(action))
    }

    val broadcastIntent = NotificationsService.createNotificationResponseBroadcastIntent(context, intent)

    val resultNotification = broadcastIntent.getParcelableExtra<Notification>(NotificationsService.NOTIFICATION_KEY)
    assertEquals("byte-array-test", resultNotification!!.notificationRequest.identifier)
  }

  /**
   * Same as above but for getNotificationResponseFromBroadcastIntent.
   */
  @Test
  fun `getNotificationResponseFromBroadcastIntent falls back to byte arrays when Parcelable extras are null`() {
    val notification = buildNotification(identifier = "fallback-test")
    val action = buildAction(identifier = "tap")

    val intent = Intent().apply {
      putExtra(NotificationsService.NOTIFICATION_BYTES_KEY, marshalParcelable(notification))
      putExtra(NotificationsService.NOTIFICATION_ACTION_BYTES_KEY, marshalParcelable(action))
    }

    val response = NotificationsService.getNotificationResponseFromBroadcastIntent(intent)

    assertEquals("fallback-test", response.notification.notificationRequest.identifier)
    assertEquals("tap", response.actionIdentifier)
  }

  /**
   * Verifies the full round-trip: intent with both Parcelable and byte array extras
   * can be consumed by both createNotificationResponseBroadcastIntent and
   * getNotificationResponseFromBroadcastIntent.
   */
  @Test
  fun `full round-trip with both Parcelable and byte array extras`() {
    val notification = buildNotification(identifier = "round-trip-test")
    val action = buildAction(identifier = "open")

    val intent = Intent().apply {
      putExtra(NotificationsService.NOTIFICATION_KEY, notification)
      putExtra(NotificationsService.NOTIFICATION_ACTION_KEY, action as android.os.Parcelable)
      putExtra(NotificationsService.NOTIFICATION_BYTES_KEY, marshalParcelable(notification))
      putExtra(NotificationsService.NOTIFICATION_ACTION_BYTES_KEY, marshalParcelable(action))
    }

    val broadcastIntent = NotificationsService.createNotificationResponseBroadcastIntent(context, intent)
    val response = NotificationsService.getNotificationResponseFromBroadcastIntent(intent)

    assertNotNull(broadcastIntent)
    assertEquals("round-trip-test", response.notification.notificationRequest.identifier)
    assertEquals("open", response.actionIdentifier)
  }

  private fun marshalParcelable(parcelable: android.os.Parcelable): ByteArray {
    val parcel = Parcel.obtain()
    parcelable.writeToParcel(parcel, 0)
    val bytes = parcel.marshall()
    parcel.recycle()
    return bytes
  }
}
