package expo.modules.notifications

import androidx.test.core.app.ApplicationProvider
import expo.modules.notifications.notifications.DataOnlyPresentationSetting
import expo.modules.notifications.notifications.PendingDataOnlyPresentationWarning
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DataOnlyNotificationPresentationTest {
  @Test
  fun fromMetaDataValue_mapsNullTrueFalse() {
    assertEquals(DataOnlyPresentationSetting.UNSET, DataOnlyPresentationSetting.fromMetaDataValue(null))
    assertEquals(DataOnlyPresentationSetting.ENABLED, DataOnlyPresentationSetting.fromMetaDataValue(true))
    assertEquals(DataOnlyPresentationSetting.DISABLED, DataOnlyPresentationSetting.fromMetaDataValue(false))
  }

  @Test
  fun shouldPresent_isFalseOnlyWhenDisabled() {
    assertTrue(DataOnlyPresentationSetting.UNSET.shouldPresent)
    assertTrue(DataOnlyPresentationSetting.ENABLED.shouldPresent)
    assertFalse(DataOnlyPresentationSetting.DISABLED.shouldPresent)
  }

  @Test
  fun deprecationWarning_isNullWhenDisabled() {
    assertNull(DataOnlyPresentationSetting.DISABLED.deprecationWarning(true))
    assertNull(DataOnlyPresentationSetting.DISABLED.deprecationWarning(false))
  }

  @Test
  fun deprecationWarning_differsPerSetting() {
    val unset = DataOnlyPresentationSetting.UNSET.deprecationWarning(true)
    val enabled = DataOnlyPresentationSetting.ENABLED.deprecationWarning(true)
    assertNotNull(unset)
    assertNotNull(enabled)
    assertNotEquals(unset, enabled)
  }

  @Test
  fun deprecationWarning_foregroundSaysNotPresented() {
    for (setting in listOf(DataOnlyPresentationSetting.UNSET, DataOnlyPresentationSetting.ENABLED)) {
      val presented = setting.deprecationWarning(true)!!
      val notPresented = setting.deprecationWarning(false)!!
      assertTrue(notPresented.contains("was not presented because the app is in the foreground"))
      assertFalse(presented.contains("not presented"))
      assertNotEquals(presented, notPresented)
    }
  }

  @Test
  fun read_returnsUnsetWithoutMetaData() {
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    assertEquals(DataOnlyPresentationSetting.UNSET, DataOnlyPresentationSetting.read(context))
  }

  @Test
  fun pendingWarning_consumeReturnsOnceAfterRepeatedRecords() {
    val context = ApplicationProvider.getApplicationContext<android.content.Context>()
    val pending = PendingDataOnlyPresentationWarning(context)
    pending.consume()
    assertFalse(pending.consume())
    pending.record()
    pending.record()
    assertTrue(PendingDataOnlyPresentationWarning(context).consume())
    assertFalse(pending.consume())
  }
}
