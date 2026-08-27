package expo.modules.notifications.service

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.service.interfaces.PresentationDelegate
import io.mockk.mockk
import io.mockk.verify
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
  }

  @Test
  fun `firing the grouped-notification delete intent triggers orphaned summary cleanup`() {
    val pendingIntent = NotificationsService.createGroupedNotificationDeletedIntent(context)
    val intent = shadowOf(pendingIntent).savedIntent

    service.handleIntent(context, intent)

    verify(exactly = 1) { presentationDelegate.removeOrphanedGroupSummaries() }
  }
}
