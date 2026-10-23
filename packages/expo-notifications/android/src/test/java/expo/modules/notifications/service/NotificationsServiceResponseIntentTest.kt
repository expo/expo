package expo.modules.notifications.service

import android.app.RemoteInput
import android.content.Intent
import android.os.Bundle
import android.os.Parcel
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import expo.modules.notifications.notifications.model.TextInputNotificationResponse
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf

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

  /**
   * Stands in for the class loader a Bundle is unparcelled with once the system has held the
   * PendingIntent: it can load framework classes but not this library's model classes.
   */
  private class BlindToNotificationClasses(parent: ClassLoader) : ClassLoader(parent) {
    override fun loadClass(name: String, resolve: Boolean): Class<*> {
      if (name.startsWith("expo.modules.notifications")) throw ClassNotFoundException(name)
      return super.loadClass(name, resolve)
    }
  }

  /** Sends an Intent through a Parcel, the way the system does when it stores a PendingIntent. */
  private fun parcelRoundTrip(intent: Intent): Intent {
    val parcel = Parcel.obtain()
    intent.writeToParcel(parcel, 0)
    parcel.setDataPosition(0)
    val restored = Intent.CREATOR.createFromParcel(parcel)
    parcel.recycle()
    return restored
  }

  /**
   * The response PendingIntent has to survive being unparcelled by a class loader that cannot see
   * this library's classes. A Bundle is unparcelled as a unit, so a single unresolvable Parcelable
   * in it fails the whole Bundle - taking the byte-array fallback down with it, which is why
   * https://github.com/expo/expo/issues/38908 kept coming back as
   * https://github.com/expo/expo/issues/49252.
   */
  @Test
  fun `response intent extras survive a class loader that cannot resolve the model classes`() {
    val notification = buildNotification(identifier = "hostile-loader-test")
    val action = NotificationAction("tap", "Open", false)

    val pendingIntent = NotificationsService.createNotificationResponseIntent(context, notification, action)
    val saved = shadowOf(pendingIntent).savedIntent

    val delivered = parcelRoundTrip(saved)
    delivered.setExtrasClassLoader(BlindToNotificationClasses(javaClass.classLoader!!))

    // Reading the extras at all is the part that used to blow up.
    val extras = delivered.extras
    assertNotNull("extras should be readable under a foreign class loader", extras)
    assertNotNull(
      "the byte-array fallback must still be there",
      extras!!.getByteArray(NotificationsService.NOTIFICATION_BYTES_KEY)
    )

    // ...and the response has to come back intact through the ordinary path.
    val response = NotificationsService.getNotificationResponseFromBroadcastIntent(delivered)
    assertEquals("hostile-loader-test", response.notification.notificationRequest.identifier)
    assertEquals("tap", response.actionIdentifier)
  }

  /**
   * Marshalled bytes carry no class name, so the action needs a key per concrete type or a direct
   * reply comes back as a base NotificationAction and `userText` never reaches JavaScript.
   */
  @Test
  fun `direct reply keeps its type and user text through the response intent`() {
    val notification = buildNotification(identifier = "reply-test")
    val action = TextInputNotificationAction("reply", "Reply", false, "Type here")

    val pendingIntent = NotificationsService.createNotificationResponseIntent(context, notification, action)
    val delivered = shadowOf(pendingIntent).savedIntent
    RemoteInput.addResultsToIntent(
      arrayOf(RemoteInput.Builder(NotificationsService.USER_TEXT_RESPONSE_KEY).build()),
      delivered,
      Bundle().apply { putString(NotificationsService.USER_TEXT_RESPONSE_KEY, "hello there") }
    )

    val response = NotificationsService.getNotificationResponseFromBroadcastIntent(delivered)

    assertTrue(
      "the action must survive as TextInputNotificationAction, got ${response.action::class.java.name}",
      response is TextInputNotificationResponse
    )
    assertEquals("hello there", (response as TextInputNotificationResponse).userText)
  }

  /** The same action still has to survive the hostile class loader the other test covers. */
  @Test
  fun `direct reply survives a class loader that cannot resolve the model classes`() {
    val notification = buildNotification(identifier = "reply-loader-test")
    val action = TextInputNotificationAction("reply", "Reply", false, "Type here")

    val pendingIntent = NotificationsService.createNotificationResponseIntent(context, notification, action)
    val delivered = parcelRoundTrip(shadowOf(pendingIntent).savedIntent)
    delivered.setExtrasClassLoader(BlindToNotificationClasses(javaClass.classLoader!!))

    val response = NotificationsService.getNotificationResponseFromBroadcastIntent(delivered)

    assertTrue(response is TextInputNotificationResponse)
    assertEquals("reply", response.actionIdentifier)
  }

  private fun marshalParcelable(parcelable: android.os.Parcelable): ByteArray {
    val parcel = Parcel.obtain()
    parcelable.writeToParcel(parcel, 0)
    val bytes = parcel.marshall()
    parcel.recycle()
    return bytes
  }
}
