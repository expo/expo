package expo.modules.notifications.service.delegates

import android.app.NotificationManager
import android.os.Bundle
import android.os.Parcel
import android.os.Parcelable
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate.Companion.GROUP_SUMMARY_NOTIFICATION_ID
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate.Companion.GROUP_SUMMARY_TAG_SUFFIX
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class ExpoPresentationDelegateTest {
  private val context = ApplicationProvider.getApplicationContext<android.content.Context>()
  private val systemNotificationManager = context.getSystemService(NotificationManager::class.java)
  private lateinit var delegate: ExpoPresentationDelegate

  @Before
  fun setup() {
    delegate = ExpoPresentationDelegate(context)
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName).applicationInfo!!.metaData = Bundle()
  }

  @Test
  fun `presentNotification posts a group summary alongside a grouped notification`() {
    present(identifier = "child-1", group = "group-a")

    val tags = activeTags()
    assertEquals(setOf("child-1", "group-a$GROUP_SUMMARY_TAG_SUFFIX"), tags)
    val summary = systemNotificationManager.activeNotifications.first { it.tag == "group-a$GROUP_SUMMARY_TAG_SUFFIX" }
    assertEquals(GROUP_SUMMARY_NOTIFICATION_ID, summary.id)
    assertEquals("group-a", summary.notification.group)
    assertTrue(summary.notification.flags and android.app.Notification.FLAG_GROUP_SUMMARY != 0)
  }

  @Test
  fun `presentNotification posts no summary for an ungrouped notification`() {
    present(identifier = "no-group", group = null)

    assertEquals(setOf("no-group"), activeTags())
  }

  @Test
  fun `presentNotification cleans up summaries orphaned by user dismissal`() {
    present(identifier = "child-1", group = "group-a")
    // Simulate the user swiping the child away: the system cancels it without going through the delegate.
    systemNotificationManager.cancel("child-1", 0)

    present(identifier = "other", group = null)

    assertEquals(setOf("other"), activeTags())
  }

  @Test
  fun `getAllPresentedNotifications excludes group summary notifications`() {
    present(identifier = "child-1", group = "group-a")

    val result = delegate.getAllPresentedNotifications()

    assertEquals(listOf("child-1"), result.map { it.notificationRequest.identifier })
    // group survives the marshall/unmarshall round-trip through the posted notification's extras
    assertEquals("group-a", result.first().notificationRequest.content.group)
  }

  @Test
  fun `getAllPresentedNotifications keeps a user notification whose identifier mimics a summary tag`() {
    present(identifier = "group-a$GROUP_SUMMARY_TAG_SUFFIX", group = "group-a")

    val identifiers = delegate.getAllPresentedNotifications().map { it.notificationRequest.identifier }

    assertEquals(listOf("group-a$GROUP_SUMMARY_TAG_SUFFIX"), identifiers)
  }

  @Test
  fun `dismissNotifications cancels the group summary once its last child is dismissed`() {
    present(identifier = "child-1", group = "group-a")

    delegate.dismissNotifications(listOf("child-1"))

    assertEquals(emptySet<String>(), activeTags())
  }

  @Test
  fun `dismissNotifications keeps the group summary while sibling children remain`() {
    present(identifier = "child-1", group = "group-a")
    present(identifier = "child-2", group = "group-a")

    delegate.dismissNotifications(listOf("child-1"))

    assertEquals(setOf("child-2", "group-a$GROUP_SUMMARY_TAG_SUFFIX"), activeTags())
  }

  @Test
  fun `removeOrphanedGroupSummaries returns without the settle-delay when no summary exists`() {
    present(identifier = "no-group", group = null)

    val elapsed = kotlin.system.measureTimeMillis { delegate.removeOrphanedGroupSummaries() }

    assertTrue("expected early return, took ${elapsed}ms", elapsed < 1000)
    assertEquals(setOf("no-group"), activeTags())
  }

  @Test
  fun `dismissNotifications does not touch summaries of other groups`() {
    present(identifier = "child-a", group = "group-a")
    present(identifier = "child-b", group = "group-b")

    delegate.dismissNotifications(listOf("child-a"))

    assertEquals(setOf("child-b", "group-b$GROUP_SUMMARY_TAG_SUFFIX"), activeTags())
  }

  private fun activeTags(): Set<String> = systemNotificationManager.activeNotifications.map { it.tag }.toSet()

  private fun present(identifier: String, group: String?) {
    val content = NotificationContent.Builder().setTitle("Title").setText("Text").setGroup(group).build()
    val request = NotificationRequest(identifier, content, StubTrigger())
    runBlocking { delegate.presentNotificationInternal(Notification(request), null) }
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
