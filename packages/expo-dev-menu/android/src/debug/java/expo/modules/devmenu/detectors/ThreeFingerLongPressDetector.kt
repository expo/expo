package expo.modules.devmenu.detectors

import android.view.MotionEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.math.abs

/**
 * The maximum distance between pointer coords to still count as "stationary".
 */
private const val PRECISION = 20.0

/**
 * Time needed to detect long press.
 */
private const val NEEDED_PRESS_TIME = 500L

/**
 * Detects three finger long press known from iOS.
 */
class ThreeFingerLongPressDetector(
  private val scope: CoroutineScope,
  private val longPressListener: () -> Unit
) {
  private var startPosition = Array(3) { MotionEvent.PointerCoords() }
  private var detectionJob: Job? = null

  /**
   * Handles touch event. If it detects long press then [longPressListener] is called.
   */
  fun onTouchEvent(event: MotionEvent?) {
    if (event == null) {
      return
    }

    when {
      event.threePointersDown() -> {
        for (i in 0..2) {
          event.getPointerCoords(i, startPosition[i])
        }
        detectionJob = scope.launch {
          delay(NEEDED_PRESS_TIME)
          detectionJob = null
          if (isActive) {
            longPressListener()
          }
        }
      }

      event.moved() -> {
        for (i in 0..2) {
          val out = MotionEvent.PointerCoords()
          event.getPointerCoords(i, out)
          if (
            abs(out.x - startPosition[i].x) > PRECISION ||
            abs(out.y - startPosition[i].y) > PRECISION
          ) {
            cancelDetection()
            return
          }
        }
      }

      event.cancelled() -> {
        cancelDetection()
      }
    }
  }

  private fun MotionEvent.threePointersDown(): Boolean {
    return pointerCount == 3 && detectionJob == null &&
      (actionMasked == MotionEvent.ACTION_POINTER_DOWN || actionMasked == MotionEvent.ACTION_MOVE)
  }

  private fun MotionEvent.moved(): Boolean {
    return actionMasked == MotionEvent.ACTION_MOVE && pointerCount == 3 && detectionJob != null
  }

  private fun MotionEvent.cancelled(): Boolean {
    // Cancel only when fingers actually lift (not on ACTION_CANCEL from gesture system)
    return actionMasked == MotionEvent.ACTION_UP || actionMasked == MotionEvent.ACTION_POINTER_UP
  }

  fun cancelDetection() {
    detectionJob?.cancel()
    detectionJob = null
  }
}
