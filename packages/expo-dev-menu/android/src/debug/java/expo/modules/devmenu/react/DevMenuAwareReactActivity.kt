package expo.modules.devmenu.react

import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactNativeHost
import expo.modules.devmenu.DevMenuManager

/**
 * Basic [ReactActivity] which knows about expo-dev-menu.
 * It dispatches key events and touch event.
 */
abstract class DevMenuAwareReactActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (currentReactNative == null || currentReactNative != reactNativeHost) {
      currentReactNative = reactNativeHost
      DevMenuManager.initializeWithReactNativeHost(reactNativeHost)
    }
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    DevMenuManager.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    return DevMenuManager.onKeyEvent(keyCode, event) || super.onKeyUp(keyCode, event)
  }

  companion object {
    @get:Synchronized
    @set:Synchronized
    var currentReactNative: ReactNativeHost? = null
  }
}
