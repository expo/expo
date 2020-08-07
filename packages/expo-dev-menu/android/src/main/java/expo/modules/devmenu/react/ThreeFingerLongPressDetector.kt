package expo.modules.devmenu.react

import android.os.SystemClock
import android.view.MotionEvent
import kotlin.math.abs

const val PRECISION = 20.0
const val NEEDED_PRESS_TIME = 1000

class ThreeFingerLongPressDetector(val onLongPress: () -> Unit) {
  var isEnable: Boolean = true

  private var startedDetecting = false
  private var startTime: Long = Long.MAX_VALUE
  private var startPosition = Array(3) {
    MotionEvent.PointerCoords()
  }

  fun onTouchEvent(event: MotionEvent?) {
    if (!isEnable) {
      return
    }

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
      if (abs(out.x - startPosition[i].x) > PRECISION
        || abs(out.y - startPosition[i].y) > PRECISION) {
        startedDetecting = false
        return
      }
    }

    if (SystemClock.uptimeMillis() - startTime >= NEEDED_PRESS_TIME) {
      onLongPress()
      startedDetecting = false
    }
  }
}
