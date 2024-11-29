package expo.modules.devmenu.react

import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactApplication
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.DevMenuManager

/**
 * Basic [ReactActivity] which knows about expo-dev-menu.
 * It dispatches key events and touch event.
 */
abstract class DevMenuAwareReactActivity : ReactActivity() {
  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    if (!DevMenuManager.isInitialized()) {
      DevMenuManager.initializeWithReactHost(
        ReactHostWrapper(
          reactNativeHost = reactNativeHost,
          reactHostProvider = { (applicationContext as ReactApplication).reactHost }
        )
      )
    } else {
      DevMenuManager.synchronizeDelegate()
    }
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    DevMenuManager.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    return DevMenuManager.onKeyEvent(keyCode, event) || super.onKeyUp(keyCode, event)
  }
}
