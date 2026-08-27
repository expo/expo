package expo.modules.notifications.notifications.presentation.builders

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import android.os.Parcel
import android.os.Parcelable
import androidx.core.app.NotificationCompat
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

// Group alert behavior is only honored by the platform starting with Android O.
@Config(sdk = [Build.VERSION_CODES.O])
@RunWith(RobolectricTestRunner::class)
class ExpoNotificationBuilderTest {
  private val context = ApplicationProvider.getApplicationContext<android.content.Context>()

  init {
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName).applicationInfo!!.metaData = Bundle()

    val notificationManager = context.getSystemService(NotificationManager::class.java)
    notificationManager.createNotificationChannel(
      NotificationChannel("expo_notifications_fallback_notification_channel", "Fallback", NotificationManager.IMPORTANCE_HIGH)
    )
  }

  @Test
  fun `build sets group and keeps the default alert behavior when content has a group`() = runBlocking {
    val androidNotification = buildNotification(group = "group-a")

    assertEquals("group-a", androidNotification.group)
    assertEquals(NotificationCompat.GROUP_ALERT_ALL, NotificationCompat.getGroupAlertBehavior(androidNotification))
  }

  @Test
  fun `build does not set group when content has no group`() = runBlocking {
    val androidNotification = buildNotification(group = null)

    assertNull(androidNotification.group)
    assertNull(androidNotification.deleteIntent)
  }

  @Test
  fun `build sets a delete intent on grouped notifications for summary cleanup`() = runBlocking {
    val androidNotification = buildNotification(group = "group-a")

    assertNotNull(androidNotification.deleteIntent)
  }

  private suspend fun buildNotification(group: String?): android.app.Notification {
    val content = NotificationContent.Builder().setTitle("Title").setText("Text").setGroup(group).build()
    val request = NotificationRequest("identifier", content, StubTrigger())
    val notification = Notification(request)
    return ExpoNotificationBuilder(context, notification, SharedPreferencesNotificationCategoriesStore(context)).build()
  }

  private class StubTrigger : NotificationTrigger {
    override fun toBundle() = bundleOf()
    override fun describeContents(): Int = 0
    override fun writeToParcel(dest: Parcel, flags: Int) {}

    companion object CREATOR : Parcelable.Creator<StubTrigger> {
      override fun createFromParcel(parcel: Parcel) = StubTrigger()
      override fun newArray(size: Int): Array<StubTrigger?> = arrayOfNulls(size)
    }
  }
}
