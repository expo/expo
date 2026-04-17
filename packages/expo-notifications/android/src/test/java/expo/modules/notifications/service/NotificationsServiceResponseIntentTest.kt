package expo.modules.notifications.service

import android.content.Intent
import android.os.Parcel
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.categories.NotificationActionRecord
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.notifications.model.TextInputNotificationAction
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

  private fun buildAction(identifier: String = "default"): NotificationActionRecord {
    return NotificationActionRecord(identifier, "Open", null, NotificationActionRecord.Options(true))
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

  // ======================================================================
  // Migration tests: simulate intents created by the OLD version of the app
  // (before the NotificationAction -> NotificationActionRecord refactor).
  //
  // When a user updates their app, any notifications already in the tray
  // still have PendingIntents containing old-format NotificationAction objects.
  // Tapping an action button after the update must not crash.
  // ======================================================================

  /**
   * Simulates a pre-update PendingIntent where the action was serialized as
   * the old NotificationAction (Java Parcelable). After update, the code
   * tries to read it as NotificationActionRecord. This must still work.
   */
  @Test
  fun `createNotificationResponseBroadcastIntent handles pre-update NotificationAction in extras`() {
    val notification = buildNotification(identifier = "migration-test")
    val legacyAction = NotificationAction("legacy-tap", "Open", true)

    // Simulate an intent created by the OLD version of createNotificationResponseIntent
    val intent = Intent().apply {
      putExtra(NotificationsService.NOTIFICATION_KEY, notification)
      putExtra(NotificationsService.NOTIFICATION_ACTION_KEY, legacyAction as android.os.Parcelable)
      putExtra(NotificationsService.NOTIFICATION_BYTES_KEY, marshalParcelable(notification))
      putExtra(NotificationsService.NOTIFICATION_ACTION_BYTES_KEY, marshalParcelable(legacyAction))
    }

    val broadcastIntent = NotificationsService.createNotificationResponseBroadcastIntent(context, intent)

    assertNotNull(broadcastIntent)
    val resultNotification = broadcastIntent.getParcelableExtra<Notification>(NotificationsService.NOTIFICATION_KEY)
    assertEquals("migration-test", resultNotification!!.notificationRequest.identifier)
  }

  /**
   * Same as above but for getNotificationResponseFromBroadcastIntent.
   */
  @Test
  fun `getNotificationResponseFromBroadcastIntent handles pre-update NotificationAction in extras`() {
    val notification = buildNotification(identifier = "migration-test-2")
    val legacyAction = NotificationAction("legacy-tap", "Open", true)

    val intent = Intent().apply {
      putExtra(NotificationsService.NOTIFICATION_KEY, notification)
      putExtra(NotificationsService.NOTIFICATION_ACTION_KEY, legacyAction as android.os.Parcelable)
      putExtra(NotificationsService.NOTIFICATION_BYTES_KEY, marshalParcelable(notification))
      putExtra(NotificationsService.NOTIFICATION_ACTION_BYTES_KEY, marshalParcelable(legacyAction))
    }

    val response = NotificationsService.getNotificationResponseFromBroadcastIntent(intent)

    assertEquals("migration-test-2", response.notification.notificationRequest.identifier)
    assertEquals("legacy-tap", response.actionIdentifier)
  }

  /**
   * Pre-update PendingIntent with only byte arrays (Android 11/12 bug path)
   * where the bytes encode a NotificationAction, not NotificationActionRecord.
   */
  @Test
  fun `byte array fallback handles pre-update NotificationAction bytes`() {
    val notification = buildNotification(identifier = "migration-bytes")
    val legacyAction = NotificationAction("legacy-action", "Tap", false)

    val intent = Intent().apply {
      // Only byte arrays, no Parcelable extras (simulating the Android 11/12 bug)
      putExtra(NotificationsService.NOTIFICATION_BYTES_KEY, marshalParcelable(notification))
      putExtra(NotificationsService.NOTIFICATION_ACTION_BYTES_KEY, marshalParcelable(legacyAction))
    }

    val broadcastIntent = NotificationsService.createNotificationResponseBroadcastIntent(context, intent)
    assertNotNull(broadcastIntent)
  }

  /**
   * Pre-update TextInputNotificationAction must also survive the migration.
   */
  @Test
  fun `handles pre-update TextInputNotificationAction in extras`() {
    val notification = buildNotification(identifier = "migration-text-input")
    val legacyAction = TextInputNotificationAction("reply", "Reply", false, "Type here...")

    val intent = Intent().apply {
      putExtra(NotificationsService.NOTIFICATION_KEY, notification)
      putExtra(NotificationsService.NOTIFICATION_ACTION_KEY, legacyAction as android.os.Parcelable)
      putExtra(NotificationsService.NOTIFICATION_BYTES_KEY, marshalParcelable(notification))
      putExtra(NotificationsService.NOTIFICATION_ACTION_BYTES_KEY, marshalParcelable(legacyAction))
    }

    val response = NotificationsService.getNotificationResponseFromBroadcastIntent(intent)

    assertEquals("migration-text-input", response.notification.notificationRequest.identifier)
    assertEquals("reply", response.actionIdentifier)
  }

  /**
   * A NotificationResponse marshalled by the OLD code contains a NotificationAction
   * inside (as mAction). After update, unmarshalling it via NotificationResponse.CREATOR
   * must still work — this is used by getNotificationResponseFromOpenIntent for cold-start
   * notification taps.
   */
  @Test
  fun `getNotificationResponseFromOpenIntent handles pre-update marshalled NotificationResponse`() {
    // Build a NotificationResponse the way the OLD code would have:
    // Old NotificationResponse stored NotificationAction, not NotificationActionRecord
    val notification = buildNotification(identifier = "cold-start-migration")
    val legacyAction = NotificationAction("default", "Open", true)

    // Manually build a Parcel the way the old NotificationResponse.writeToParcel did:
    // it wrote mAction (NotificationAction) then mNotification
    val responseBytes = run {
      val parcel = Parcel.obtain()
      parcel.writeParcelable(legacyAction, 0)
      parcel.writeParcelable(notification, 0)
      val bytes = parcel.marshall()
      parcel.recycle()
      bytes
    }

    val intent = Intent().apply {
      putExtra(NotificationsService.NOTIFICATION_RESPONSE_KEY, responseBytes)
    }

    val response = NotificationsService.getNotificationResponseFromOpenIntent(intent)

    assertNotNull("Response should not be null", response)
    assertEquals("cold-start-migration", response!!.notification.notificationRequest.identifier)
    assertEquals("default", response.actionIdentifier)
  }

  private fun marshalParcelable(parcelable: android.os.Parcelable): ByteArray {
    val parcel = Parcel.obtain()
    parcelable.writeToParcel(parcel, 0)
    val bytes = parcel.marshall()
    parcel.recycle()
    return bytes
  }
}
