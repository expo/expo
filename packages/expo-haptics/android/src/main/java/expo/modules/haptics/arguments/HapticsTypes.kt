package expo.modules.haptics.arguments

import android.annotation.SuppressLint
import android.os.Build
import android.view.HapticFeedbackConstants

enum class NotificationType(val value: String) {
  SUCCESS("success"),
  WARNING("warning"),
  ERROR("error");

  val vibration: VibrationType
    get() = when (this) {
      SUCCESS -> VibrationType(
        longArrayOf(0, 40, 100, 40),
        intArrayOf(0, 50, 0, 60),
        longArrayOf(0, 40, 100, 40)
      )

      WARNING -> VibrationType(
        longArrayOf(0, 40, 120, 60),
        intArrayOf(0, 40, 0, 60),
        longArrayOf(0, 40, 120, 60)
      )

      ERROR -> VibrationType(
        longArrayOf(0, 60, 100, 40, 80, 50),
        intArrayOf(0, 50, 0, 40, 0, 50),
        longArrayOf(0, 60, 100, 40, 80, 50)
      )
    }
}

enum class ImpactStyle(val value: String) {
  LIGHT("light"),
  MEDIUM("medium"),
  HEAVY("heavy"),
  SOFT("soft"),
  RIGID("rigid");

  val vibration: VibrationType
    get() = when (this) {
      LIGHT, SOFT -> VibrationType(
        longArrayOf(0, 50),
        intArrayOf(0, 30),
        longArrayOf(0, 20)
      )

      MEDIUM, RIGID -> VibrationType(
        longArrayOf(0, 43),
        intArrayOf(0, 50),
        longArrayOf(0, 43)
      )

      HEAVY -> VibrationType(
        longArrayOf(0, 60),
        intArrayOf(0, 70),
        longArrayOf(0, 61)
      )
    }
}

enum class HapticType(val value: String) {
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

  @SuppressLint("InlinedApi")
  fun toHapticFeedbackType(sdkInt: Int = Build.VERSION.SDK_INT): Int {
    if (sdkInt < addedInSdk) {
      throw HapticTypeNotSupportedException(value)
    }

    return when (this) {
      CONFIRM -> HapticFeedbackConstants.CONFIRM
      REJECT -> HapticFeedbackConstants.REJECT
      GESTURE_START -> HapticFeedbackConstants.GESTURE_START
      GESTURE_END -> HapticFeedbackConstants.GESTURE_END
      TOGGLE_ON -> HapticFeedbackConstants.TOGGLE_ON
      TOGGLE_OFF -> HapticFeedbackConstants.TOGGLE_OFF
      CLOCK_TICK -> HapticFeedbackConstants.CLOCK_TICK
      CONTEXT_CLICK -> HapticFeedbackConstants.CONTEXT_CLICK
      DRAG_START -> HapticFeedbackConstants.DRAG_START
      KEYBOARD_TAP -> HapticFeedbackConstants.KEYBOARD_TAP
      KEYBOARD_PRESS -> HapticFeedbackConstants.KEYBOARD_PRESS
      KEYBOARD_RELEASE -> HapticFeedbackConstants.KEYBOARD_RELEASE
      LONG_PRESS -> HapticFeedbackConstants.LONG_PRESS
      VIRTUAL_KEY -> HapticFeedbackConstants.VIRTUAL_KEY
      NO_HAPTICS -> HapticFeedbackConstants.NO_HAPTICS
      SEGMENT_TICK -> HapticFeedbackConstants.SEGMENT_TICK
      SEGMENT_FREQUENT_TICK -> HapticFeedbackConstants.SEGMENT_FREQUENT_TICK
      TEXT_HANDLE_MOVE -> HapticFeedbackConstants.TEXT_HANDLE_MOVE
      VIRTUAL_KEY_RELEASE -> HapticFeedbackConstants.VIRTUAL_KEY_RELEASE
    }
  }

  private val addedInSdk: Int
    get() = when (this) {
      CLOCK_TICK, CONTEXT_CLICK, KEYBOARD_TAP, LONG_PRESS, VIRTUAL_KEY ->
        Build.VERSION_CODES.BASE

      KEYBOARD_PRESS, KEYBOARD_RELEASE, TEXT_HANDLE_MOVE, VIRTUAL_KEY_RELEASE ->
        Build.VERSION_CODES.O_MR1

      CONFIRM, REJECT, GESTURE_START, GESTURE_END ->
        Build.VERSION_CODES.R

      DRAG_START, NO_HAPTICS, SEGMENT_TICK, SEGMENT_FREQUENT_TICK, TOGGLE_ON, TOGGLE_OFF ->
        Build.VERSION_CODES.UPSIDE_DOWN_CAKE
    }
}

data class VibrationType(
  val timings: LongArray,
  val amplitudes: IntArray,
  val oldSDKPattern: LongArray
) {
  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }

    if (javaClass != other?.javaClass) {
      return false
    }

    other as VibrationType

    return timings.contentEquals(other.timings) &&
      amplitudes.contentEquals(other.amplitudes) &&
      oldSDKPattern.contentEquals(other.oldSDKPattern)
  }

  override fun hashCode(): Int {
    var result = timings.contentHashCode()
    result = 31 * result + amplitudes.contentHashCode()
    result = 31 * result + oldSDKPattern.contentHashCode()
    return result
  }
}

val SelectionType = VibrationType(
  timings = longArrayOf(0, 50),
  amplitudes = intArrayOf(0, 30),
  oldSDKPattern = longArrayOf(0, 70)
)
