package expo.modules.devmenu.detectors

import android.os.Build
import android.view.KeyEvent
import android.view.KeyboardShortcutGroup
import android.view.Menu
import android.view.MotionEvent
import android.view.Window
import androidx.annotation.RequiresApi

/**
 * A [Window.Callback] that intercepts touch events to detect three-finger long press gestures and
 * dispatchKeyEvent to detect cmd + m.
 * Delegates all other calls to the [wrapped] callback.
 */
internal class InterceptingWindowCallback(
  private val wrapped: Window.Callback,
  private var threeFingerLongPressDetector: ThreeFingerLongPressDetector,
  private var keyEventDispatcher: (KeyEvent) -> Boolean
) : Window.Callback by wrapped {
  fun updateDetector(newDetector: ThreeFingerLongPressDetector) {
    threeFingerLongPressDetector.cancelDetection()
    threeFingerLongPressDetector = newDetector
  }

  fun updateKeyEventDispatcher(newDispatcher: (KeyEvent) -> Boolean) {
    keyEventDispatcher = newDispatcher
  }

  override fun dispatchTouchEvent(event: MotionEvent?): Boolean {
    threeFingerLongPressDetector.onTouchEvent(event)
    return wrapped.dispatchTouchEvent(event)
  }

  override fun dispatchKeyEvent(event: KeyEvent?): Boolean {
    event?.let { event ->
      val isMenuKey = event.keyCode == KeyEvent.KEYCODE_MENU && event.action == KeyEvent.ACTION_UP
      if (isMenuKey) {
        return keyEventDispatcher(event)
      }
    }
    return wrapped.dispatchKeyEvent(event)
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
