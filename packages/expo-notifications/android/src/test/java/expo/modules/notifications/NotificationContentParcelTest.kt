package expo.modules.notifications

import android.os.Parcel
import expo.modules.notifications.notifications.model.NotificationContent
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NotificationContentParcelTest {
  @Test
  fun `group survives a Parcel round trip`() {
    val original = NotificationContent.Builder().setTitle("Title").setSticky(true).setGroup("group-a").build()

    val parcel = Parcel.obtain()
    try {
      original.writeToParcel(parcel, 0)
      parcel.setDataPosition(0)
      val restored = NotificationContent.CREATOR.createFromParcel(parcel)

      assertEquals("group-a", restored.group)
      assertEquals(true, restored.isSticky)
    } finally {
      parcel.recycle()
    }
  }
}
