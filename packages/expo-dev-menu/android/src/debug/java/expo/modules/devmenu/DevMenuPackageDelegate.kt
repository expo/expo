package expo.modules.devmenu

import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactNativeHost
import expo.modules.core.interfaces.ReactActivityHandler

object DevMenuPackageDelegate {
  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> =
    listOf(
      object : ReactActivityHandler {
        override fun onPostCreate(savedInstanceState: Bundle?, reactNativeHost: ReactNativeHost) {
          if (!DevMenuManager.isInitialized()) {
            DevMenuManager.initializeWithReactNativeHost(reactNativeHost)
          } else {
            DevMenuManager.synchronizeDelegate()
          }
        }

        override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
          DevMenuManager.onTouchEvent(ev)
          return false
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          return DevMenuManager.onKeyEvent(keyCode, event)
        }
      }
    )
}
