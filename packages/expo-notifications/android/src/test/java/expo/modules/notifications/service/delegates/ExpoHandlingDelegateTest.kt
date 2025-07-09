package expo.modules.notifications.service.delegates

import android.os.Parcel
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.NotificationManager
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.NotificationsService
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.spyk
import io.mockk.verify
import org.json.JSONObject
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ExpoHandlingDelegateTest {
  private val notificationManager: NotificationManager = mockk()
  private lateinit var delegateSpy: ExpoHandlingDelegate

  @Before
  fun setup() {
    delegateSpy = spyk(ExpoHandlingDelegate(ApplicationProvider.getApplicationContext()))
    every { delegateSpy.getListeners() } answers { listOf(notificationManager) }

    every { notificationManager.onNotificationReceived(any()) } answers { }

    mockkObject(NotificationsService)
    every { NotificationsService.present(any(), any(), any(), any()) } answers {}
  }

  @Test
  fun `handleNotification when in foreground invokes listener and does not present`() {
    every { delegateSpy.isAppInForeground() } answers { true }
    val expectedNotification = buildNotification(title = "You got a push!", text = "Pushes are great!")

    delegateSpy.handleNotification(expectedNotification)
    verify { notificationManager.onNotificationReceived(expectedNotification) }
    verify(inverse = true) { NotificationsService.present(any(), any(), any(), any()) }
  }

  @Test
  fun `handleNotification when in background does not invoke listener and presents notification`() {
    every { delegateSpy.isAppInForeground() } answers { false }
    val expectedNotification = buildNotification(title = "You got a push!", text = "Pushes are great!")

    delegateSpy.handleNotification(expectedNotification)

    verify(inverse = true) { notificationManager.onNotificationReceived(any()) }
    verify { NotificationsService.present(any(), expectedNotification, any(), any()) }
  }

  @Test
  fun `handleNotification when in background with title only presents notification`() {
    every { delegateSpy.isAppInForeground() } answers { false }
    val expectedNotification = buildNotification(title = "You got a push!")

    delegateSpy.handleNotification(expectedNotification)

    verify(inverse = true) { notificationManager.onNotificationReceived(any()) }
    verify { NotificationsService.present(any(), expectedNotification, any(), any()) }
  }

  @Test
  fun `handleNotification when in background with text only presents notification`() {
    every { delegateSpy.isAppInForeground() } answers { false }
    val expectedNotification = buildNotification(text = "Pushes are great!")

    delegateSpy.handleNotification(expectedNotification)

    verify(inverse = true) { notificationManager.onNotificationReceived(any()) }
    verify { NotificationsService.present(any(), expectedNotification, any(), any()) }
  }

  @Test
  fun `handleNotification when in background and data only does not present notification`() {
    every { delegateSpy.isAppInForeground() } answers { false }

    delegateSpy.handleNotification(
      buildNotification(body = JSONObject("""{ "key": "value" })"""))
    )

    verify(inverse = true) { notificationManager.onNotificationReceived(any()) }
    verify(inverse = true) { NotificationsService.present(any(), any(), any(), any()) }
  }

  private fun buildNotification(
    title: String? = null,
    text: String? = null,
    body: JSONObject? = null
  ): Notification {
    return Notification(
      NotificationRequest(
        "identifier",
        NotificationContent.Builder().setTitle(title).setText(text).setBody(body).build(),
        object : NotificationTrigger {
          override fun toBundle() = bundleOf()

          override fun describeContents(): Int = -1
          override fun writeToParcel(dest: Parcel, flags: Int) {}
        }
      )
    )
  }
}
