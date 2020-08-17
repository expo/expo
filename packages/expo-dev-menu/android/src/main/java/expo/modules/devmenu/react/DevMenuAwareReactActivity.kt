package expo.modules.devmenu.react

import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import expo.modules.devmenu.DevMenuDefaultDelegate
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.detectors.ThreeFingerLongPressDetector

/**
 * Basic [ReactActivity] which knows about expo-dev-menu.
 * It can detect a long press and dispatch key events.
 */
abstract class DevMenuAwareReactActivity : ReactActivity() {
  private val longPressListener: () -> Unit = {
    DevMenuManager.getSettings()?.let {
      if (it.touchGestureEnabled) {
        threeFingerLongPressDetector.isEnabled = false
        DevMenuManager.openMenu(this)
      }
    }
  }
  private val threeFingerLongPressDetector = ThreeFingerLongPressDetector(longPressListener)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (!wasInitialized) {
      wasInitialized = true
      DevMenuManager.setDelegate(DevMenuDefaultDelegate(reactNativeHost))
    }
  }

  override fun onResume() {
    super.onResume()
    threeFingerLongPressDetector.isEnabled = true
  }

  override fun onPause() {
    super.onPause()
    threeFingerLongPressDetector.isEnabled = false
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

  companion object {
    @get:Synchronized
    @set:Synchronized
    var wasInitialized = false
  }
}
