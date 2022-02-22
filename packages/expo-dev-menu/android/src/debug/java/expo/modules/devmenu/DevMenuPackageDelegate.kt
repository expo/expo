package expo.modules.devmenu

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.ReactApplication
import com.facebook.react.ReactRootView
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

object DevMenuPackageDelegate {
  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
          if (!DevMenuManager.isInitialized()) {
            DevMenuManager.initializeWithReactNativeHost((activity.application as ReactApplication).reactNativeHost)
          } else {
            DevMenuManager.synchronizeDelegate()
          }
        }
      }
    )

  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> =
    listOf(
      object : ReactActivityHandler {
        override fun createReactRootViewContainer(activity: Activity): ReactRootView {
          return DevMenuReactRootViewContainer(activity as Context)
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          return DevMenuManager.onKeyEvent(keyCode, event)
        }
      }
    )
}
