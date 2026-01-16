package expo.modules.devmenu.detectors

import android.os.Build
import android.view.KeyboardShortcutGroup
import android.view.Menu
import android.view.MotionEvent
import android.view.Window
import androidx.annotation.RequiresApi

/**
 * A [Window.Callback] that intercepts touch events to detect three-finger long press gestures.
 * Delegates all other calls to the [wrapped] callback.
 */
internal class TouchInterceptingWindowCallback(
  private val wrapped: Window.Callback,
  private var detector: ThreeFingerLongPressDetector
) : Window.Callback by wrapped {
  fun updateDetector(newDetector: ThreeFingerLongPressDetector) {
    detector.cancelDetection()
    detector = newDetector
  }

  override fun dispatchTouchEvent(event: MotionEvent?): Boolean {
    detector.onTouchEvent(event)
    return wrapped.dispatchTouchEvent(event)
  }

  @RequiresApi(Build.VERSION_CODES.O)
  override fun onPointerCaptureChanged(hasCapture: Boolean) {
    wrapped.onPointerCaptureChanged(hasCapture)
  }

  override fun onProvideKeyboardShortcuts(
    data: List<KeyboardShortcutGroup?>?,
    menu: Menu?,
    deviceId: Int
  ) {
    wrapped.onProvideKeyboardShortcuts(data, menu, deviceId)
  }
}
