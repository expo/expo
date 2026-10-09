package expo.modules.haptics

import android.os.Build
import android.view.HapticFeedbackConstants
import expo.modules.haptics.arguments.HapticType
import expo.modules.haptics.arguments.HapticTypeNotSupportedException
import expo.modules.haptics.arguments.ImpactStyle
import expo.modules.haptics.arguments.NotificationType
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class HapticsModuleTest {
  @Test
  fun `notification types cross as the values JavaScript passes`() {
    assertEquals(listOf("success", "warning", "error"), NotificationType.entries.map { it.value })
  }

  @Test
  fun `impact styles cross as the values JavaScript passes`() {
    assertEquals(
      listOf("light", "medium", "heavy", "soft", "rigid"),
      ImpactStyle.entries.map { it.value }
    )
  }

  @Test
  fun `each notification type keeps its vibration pattern`() {
    assertArrayEquals(longArrayOf(0, 40, 100, 40), NotificationType.SUCCESS.vibration.timings)
    assertArrayEquals(intArrayOf(0, 40, 0, 60), NotificationType.WARNING.vibration.amplitudes)
    assertArrayEquals(longArrayOf(0, 60, 100, 40, 80, 50), NotificationType.ERROR.vibration.oldSDKPattern)
  }

  @Test
  fun `soft and rigid impacts reuse the light and medium patterns`() {
    assertEquals(ImpactStyle.LIGHT.vibration, ImpactStyle.SOFT.vibration)
    assertEquals(ImpactStyle.MEDIUM.vibration, ImpactStyle.RIGID.vibration)
    assertArrayEquals(intArrayOf(0, 70), ImpactStyle.HEAVY.vibration.amplitudes)
  }

  @Test
  fun `android haptic types cross as the values JavaScript passes`() {
    assertEquals("gesture-start", HapticType.GESTURE_START.value)
    assertEquals("virtual-key-release", HapticType.VIRTUAL_KEY_RELEASE.value)
  }

  @Test
  fun `each android haptic type maps to the feedback constant of the same name`() {
    for (type in HapticType.entries) {
      val constant = HapticFeedbackConstants::class.java.getField(type.name).getInt(null)
      assertEquals(type.name, constant, type.toHapticFeedbackType(sdkInt = Build.VERSION_CODES.UPSIDE_DOWN_CAKE))
    }
  }

  @Test
  fun `android haptic types throw below the api level that adds them`() {
    val typesByApiLevel = mapOf(
      Build.VERSION_CODES.O_MR1 to listOf(
        HapticType.KEYBOARD_PRESS,
        HapticType.KEYBOARD_RELEASE,
        HapticType.TEXT_HANDLE_MOVE,
        HapticType.VIRTUAL_KEY_RELEASE
      ),
      Build.VERSION_CODES.R to listOf(
        HapticType.CONFIRM,
        HapticType.REJECT,
        HapticType.GESTURE_START,
        HapticType.GESTURE_END
      ),
      Build.VERSION_CODES.UPSIDE_DOWN_CAKE to listOf(
        HapticType.DRAG_START,
        HapticType.NO_HAPTICS,
        HapticType.SEGMENT_TICK,
        HapticType.SEGMENT_FREQUENT_TICK,
        HapticType.TOGGLE_ON,
        HapticType.TOGGLE_OFF
      )
    )
    for ((apiLevel, types) in typesByApiLevel) {
      for (type in types) {
        type.toHapticFeedbackType(sdkInt = apiLevel)
        val error = assertThrows(type.name, HapticTypeNotSupportedException::class.java) {
          type.toHapticFeedbackType(sdkInt = apiLevel - 1)
        }
        assertEquals(
          "This device doesn't support the selected haptic type: ${type.value}",
          error.message
        )
      }
    }
  }

  @Test
  fun `the oldest android haptic types work on the lowest supported api level`() {
    val types = listOf(
      HapticType.CLOCK_TICK,
      HapticType.CONTEXT_CLICK,
      HapticType.KEYBOARD_TAP,
      HapticType.LONG_PRESS,
      HapticType.VIRTUAL_KEY
    )
    for (type in types) {
      type.toHapticFeedbackType(sdkInt = Build.VERSION_CODES.N)
    }
  }
}
