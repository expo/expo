package expo.modules.notifications

import android.net.Uri
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

  @Test
  fun `image survives a Parcel round trip`() {
    val original = NotificationContent.Builder().setImage(Uri.parse("file:///data/image.jpg")).build()

    val parcel = Parcel.obtain()
    try {
      original.writeToParcel(parcel, 0)
      parcel.setDataPosition(0)
      val restored = NotificationContent.CREATOR.createFromParcel(parcel)

      assertEquals(Uri.parse("file:///data/image.jpg"), restored.imageUri)
    } finally {
      parcel.recycle()
    }
  }
}
