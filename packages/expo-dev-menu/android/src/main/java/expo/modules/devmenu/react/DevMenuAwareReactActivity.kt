package expo.modules.devmenu.react

import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import expo.modules.devmenu.detectors.ThreeFingerLongPressDetector
import expo.modules.devmenu.DevMenuManager

abstract class DevMenuAwareReactActivity : ReactActivity() {
  private val longPressListener: () -> Unit = {
    DevMenuManager.getSettings()?.let {
      if (it.touchGestureEnabled) {
        threeFingerLongPressDetector.isEnable = false
        DevMenuManager.openMenu(this)
      }
    }
  }
  private val threeFingerLongPressDetector = ThreeFingerLongPressDetector(longPressListener)

  override fun onResume() {
    super.onResume()
    threeFingerLongPressDetector.isEnable = true
  }

  override fun onPause() {
    super.onPause()
    threeFingerLongPressDetector.isEnable = false
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    threeFingerLongPressDetector.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    if (keyCode == KeyEvent.KEYCODE_MENU) {
      DevMenuManager.openMenu(this)
      return true
    }
    return DevMenuManager.onKeyEvent(keyCode, event) || super.onKeyDown(keyCode, event)
  }
}
