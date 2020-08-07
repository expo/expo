package expo.modules.devmenu.react

import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import expo.modules.devmenu.managers.DevMenuManager

abstract class DevMenuAwareReactActivity : ReactActivity() {
  private val longPressListener: () -> Unit = {
    DevMenuManager.settings?.let {
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

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    when (keyCode) {
      KeyEvent.KEYCODE_T -> {
        DevMenuManager.openMenu(this)
        return true
      }
      KeyEvent.KEYCODE_M -> {
        reactInstanceManager.devSupportManager.showDevOptionsDialog()
        return true
      }
    }
    return super.onKeyDown(keyCode, event)
  }

}
