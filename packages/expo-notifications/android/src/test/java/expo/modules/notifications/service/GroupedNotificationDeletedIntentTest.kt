package expo.modules.notifications.service

import android.content.Context
import android.content.Intent
import android.os.Parcelable
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.service.interfaces.HandlingDelegate
import expo.modules.notifications.service.interfaces.PresentationDelegate
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertNotEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class GroupedNotificationDeletedIntentTest {
  private val context = ApplicationProvider.getApplicationContext<Context>()
  private val presentationDelegate: PresentationDelegate = mockk(relaxed = true)

  private val service = object : NotificationsService() {
    public override fun getPresentationDelegate(context: Context) = presentationDelegate
    public override fun getHandlingDelegate(context: Context): HandlingDelegate = mockk(relaxed = true)
  }

  @Test
  fun `firing the grouped-notification delete intent cleans up the dismissed notification's summary`() {
    val pendingIntent = NotificationsService.createGroupedNotificationDeletedIntent(context, notification("child-1"))
    val intent = shadowOf(pendingIntent).savedIntent

    service.handleIntent(context, intent)

    verify(exactly = 1) { presentationDelegate.removeOrphanedGroupSummaries(match { it.notificationRequest.identifier == "child-1" }) }
  }

  @Test
  fun `the delete intent falls back to the byte-array extra when the Parcelable extra is missing`() {
    val pendingIntent = NotificationsService.createGroupedNotificationDeletedIntent(context, notification("child-1"))
    val intent = shadowOf(pendingIntent).savedIntent.apply { removeExtra(NotificationsService.NOTIFICATION_KEY) }

    service.handleIntent(context, intent)

    verify(exactly = 1) { presentationDelegate.removeOrphanedGroupSummaries(match { it.notificationRequest.identifier == "child-1" }) }
  }

  @Test
  fun `delete intents of two grouped notifications do not overwrite each other`() {
    val first = NotificationsService.createGroupedNotificationDeletedIntent(context, notification("child-1"))
    val second = NotificationsService.createGroupedNotificationDeletedIntent(context, notification("child-2"))

    assertNotEquals(first, second)
  }

  @Test
  fun `tapping an auto-dismissed grouped notification cleans up its summary`() {
    val notification = notification("child-1", autoDismiss = true)
    val tap = NotificationAction(NotificationResponse.DEFAULT_ACTION_IDENTIFIER, null, false)

    service.onReceiveNotificationResponse(context, responseIntent(notification, tap))

    verify(exactly = 1) { presentationDelegate.removeOrphanedGroupSummaries(match { it.notificationRequest.identifier == "child-1" }) }
  }

  @Test
  fun `tapping an ungrouped auto-dismissed notification skips summary cleanup`() {
    val notification = notification("solo", autoDismiss = true, group = null)
    val tap = NotificationAction(NotificationResponse.DEFAULT_ACTION_IDENTIFIER, null, false)

    service.onReceiveNotificationResponse(context, responseIntent(notification, tap))

    verify(exactly = 0) { presentationDelegate.removeOrphanedGroupSummaries(any()) }
  }

  @Test
  fun `pressing an action button leaves the summary alone`() {
    val notification = notification("child-1", autoDismiss = true)
    val action = NotificationAction("reply", "Reply", false)

    service.onReceiveNotificationResponse(context, responseIntent(notification, action))

    verify(exactly = 0) { presentationDelegate.removeOrphanedGroupSummaries(any()) }
  }

  private fun responseIntent(notification: Notification, action: NotificationAction) = Intent().apply {
    putExtra(NotificationsService.NOTIFICATION_KEY, notification)
    putExtra(NotificationsService.NOTIFICATION_ACTION_KEY, action as Parcelable)
  }

  private fun notification(identifier: String, autoDismiss: Boolean = false, group: String? = "group-a"): Notification {
    val content = NotificationContent.Builder().setTitle("Title").setGroup(group).setAutoDismiss(autoDismiss).build()
    return Notification(NotificationRequest(identifier, content, null))
  }
}
