package expo.modules.devmenu.detectors

import android.os.SystemClock
import android.view.MotionEvent
import kotlin.math.abs

/**
 * The maximum distance between pointer cords in regards to the previous event.
 */
private const val PRECISION = 20.0

/**
 * Time needed to detect long press.
 */
private const val NEEDED_PRESS_TIME = 800

/**
 * Detects three finger long press know from iOS.
 */
class ThreeFingerLongPressDetector(val longPressListener: () -> Unit) {
  private var startedDetecting = false
  private var startTime = Long.MAX_VALUE
  private var startPosition = Array(3) { MotionEvent.PointerCoords() }

  /**
   * Handles touch event. If it detects long press then [longPressListener] is called.
   */
  fun onTouchEvent(event: MotionEvent?) {
    if (!startedDetecting && event?.action == MotionEvent.ACTION_MOVE && event.pointerCount == 3) {
      startedDetecting = true
      startTime = SystemClock.uptimeMillis()
      for (i in 0..2) {
        event.getPointerCoords(i, startPosition[i])
      }
      return
    }

    if (event?.action != MotionEvent.ACTION_MOVE || event.pointerCount != 3) {
      startedDetecting = false
      return
    }

    for (i in 0..2) {
      val out = MotionEvent.PointerCoords()
      event.getPointerCoords(i, out)
      if (
        abs(out.x - startPosition[i].x) > PRECISION ||
        abs(out.y - startPosition[i].y) > PRECISION
      ) {
        startedDetecting = false
        return
      }
    }

    if (SystemClock.uptimeMillis() - startTime >= NEEDED_PRESS_TIME) {
      longPressListener()
      startedDetecting = false
    }
  }
}
