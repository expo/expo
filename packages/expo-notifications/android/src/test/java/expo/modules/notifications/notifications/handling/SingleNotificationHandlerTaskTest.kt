package expo.modules.notifications.notifications.handling

import android.os.Handler
import android.os.Looper
import android.os.Parcel
import android.os.ResultReceiver
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.kotlin.Promise
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.NotificationsService
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.slot
import io.mockk.verify
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class SingleNotificationHandlerTaskTest {
  private val eventEmitter: EventEmitter = mockk(relaxed = true)
  private val delegate: NotificationsHandler = mockk(relaxed = true)
  private val promise: Promise = mockk(relaxed = true)
  private lateinit var handler: Handler

  @Before
  fun setup() {
    handler = Handler(Looper.getMainLooper())
    mockkObject(NotificationsService)
  }

  @Test
  fun `presentation failure without result data rejects the promise`() {
    val receiver = slot<ResultReceiver>()
    every { NotificationsService.present(any(), any(), any(), capture(receiver)) } answers {
      receiver.captured.send(NotificationsService.ERROR_CODE, null)
    }

    task().processNotificationWithBehavior(NotificationBehaviorRecord.ALLOW_ALL, promise)
    shadowOf(Looper.getMainLooper()).idle()

    verify { promise.reject("ERR_NOTIFICATION_PRESENTATION_FAILED", any(), any()) }
  }

  @Test
  fun `successful presentation resolves the promise`() {
    val receiver = slot<ResultReceiver>()
    every { NotificationsService.present(any(), any(), any(), capture(receiver)) } answers {
      receiver.captured.send(NotificationsService.SUCCESS_CODE, null)
    }

    task().processNotificationWithBehavior(NotificationBehaviorRecord.ALLOW_ALL, promise)
    shadowOf(Looper.getMainLooper()).idle()

    verify { promise.resolve() }
  }

  private fun task() = SingleNotificationHandlerTask(
    ApplicationProvider.getApplicationContext(),
    eventEmitter,
    handler,
    notification(),
    delegate
  )

  private fun notification() = Notification(
    NotificationRequest(
      "identifier",
      NotificationContent.Builder().setTitle("title").setText("text").build(),
      object : NotificationTrigger {
        override fun toBundle() = bundleOf()

        override fun describeContents(): Int = -1
        override fun writeToParcel(dest: Parcel, flags: Int) {}
      }
    )
  )
}
