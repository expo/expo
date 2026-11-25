package expo.modules.notifications

import android.app.Notification
import android.media.AudioAttributes
import androidx.core.app.NotificationManagerCompat
import expo.modules.notifications.notifications.enums.AudioContentType
import expo.modules.notifications.notifications.enums.AudioUsage
import expo.modules.notifications.notifications.enums.NotificationImportance
import expo.modules.notifications.notifications.enums.NotificationVisibility
import org.junit.Assert.assertEquals
import org.junit.Test

class NotificationEnumsTest {
  private fun <T> assertRoundTrips(
    values: Array<T>,
    enumValue: (T) -> Int,
    nativeValue: (T) -> Int,
    fromEnumValue: (Int) -> T,
    fromNativeValue: (Int) -> T
  ) {
    values.forEach {
      assertEquals(it, fromEnumValue(enumValue(it)))
      // Multiple enum members may share the same native value.
      assertEquals(nativeValue(it), nativeValue(fromNativeValue(nativeValue(it))))
    }
  }

  @Test
  fun `lookups round-trip through their own value space`() {
    assertRoundTrips(AudioUsage.values(), { it.enumValue }, { it.nativeValue }, AudioUsage::fromEnumValue, AudioUsage::fromNativeValue)
    assertRoundTrips(AudioContentType.values(), { it.enumValue }, { it.nativeValue }, AudioContentType::fromEnumValue, AudioContentType::fromNativeValue)
    assertRoundTrips(NotificationImportance.values(), { it.enumValue }, { it.nativeValue }, NotificationImportance::fromEnumValue, NotificationImportance::fromNativeValue)
    assertRoundTrips(NotificationVisibility.values(), { it.enumValue }, { it.nativeValue }, NotificationVisibility::fromEnumValue, NotificationVisibility::fromNativeValue)
  }

  @Test
  fun `native lookups read the native value, not the enum value`() {
    assertEquals(NotificationVisibility.SECRET, NotificationVisibility.fromNativeValue(Notification.VISIBILITY_SECRET))
    assertEquals(NotificationVisibility.PRIVATE, NotificationVisibility.fromNativeValue(Notification.VISIBILITY_PRIVATE))
    assertEquals(NotificationImportance.UNSPECIFIED, NotificationImportance.fromNativeValue(NotificationManagerCompat.IMPORTANCE_UNSPECIFIED))
    assertEquals(NotificationImportance.MAX, NotificationImportance.fromNativeValue(NotificationManagerCompat.IMPORTANCE_MAX))
    assertEquals(AudioUsage.ALARM, AudioUsage.fromNativeValue(AudioAttributes.USAGE_ALARM))
    assertEquals(AudioContentType.MUSIC, AudioContentType.fromNativeValue(AudioAttributes.CONTENT_TYPE_MUSIC))
  }

  @Test
  fun `unmatched values fall back to the default member`() {
    assertEquals(AudioUsage.UNKNOWN, AudioUsage.fromEnumValue(999))
    assertEquals(AudioContentType.UNKNOWN, AudioContentType.fromEnumValue(999))
    assertEquals(NotificationImportance.UNKNOWN, NotificationImportance.fromEnumValue(999))
    assertEquals(NotificationVisibility.UNKNOWN, NotificationVisibility.fromEnumValue(999))
  }
}
