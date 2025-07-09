package expo.modules.haptics

import android.view.HapticFeedbackConstants
import expo.modules.haptics.arguments.HapticTypeNotSupportedException
import expo.modules.haptics.arguments.HapticsNotSupportedException
import expo.modules.kotlin.types.Enumerable

enum class HapticType(val value: String) : Enumerable {
  CONFIRM("confirm"),
  REJECT("reject"),
  GESTURE_START("gesture-start"),
  GESTURE_END("gesture-end"),
  TOGGLE_ON("toggle-on"),
  TOGGLE_OFF("toggle-off"),
  CLOCK_TICK("clock-tick"),
  CONTEXT_CLICK("context-click"),
  DRAG_START("drag-start"),
  KEYBOARD_TAP("keyboard-tap"),
  KEYBOARD_PRESS("keyboard-press"),
  KEYBOARD_RELEASE("keyboard-release"),
  LONG_PRESS("long-press"),
  VIRTUAL_KEY("virtual-key"),
  NO_HAPTICS("no-haptics"),
  SEGMENT_TICK("segment-tick"),
  SEGMENT_FREQUENT_TICK("segment-frequent-tick"),
  TEXT_HANDLE_MOVE("text-handle-move"),
  VIRTUAL_KEY_RELEASE("virtual-key-release");

  fun toHapticFeedbackType(): Int {
    val fieldName = this.name
    // We use reflection because the values availability is spread across various api levels
    // so this avoids nested availability checks and redundant cases
    // All are available on api 34 and above, some more are only available on api 30 and above
    return try {
      val field = HapticFeedbackConstants::class.java.getDeclaredField(fieldName)
      field.getInt(null)
    } catch (e: NoSuchFieldException) {
      // These should be available on all api levels
      when (this) {
        CLOCK_TICK -> HapticFeedbackConstants.CLOCK_TICK
        CONTEXT_CLICK -> HapticFeedbackConstants.CONTEXT_CLICK
        KEYBOARD_TAP -> HapticFeedbackConstants.KEYBOARD_TAP
        LONG_PRESS -> HapticFeedbackConstants.LONG_PRESS
        VIRTUAL_KEY -> HapticFeedbackConstants.VIRTUAL_KEY
        else -> throw HapticsNotSupportedException()
      }
    } catch (e: IllegalAccessException) {
      throw HapticTypeNotSupportedException(this.value)
    }
  }
}
