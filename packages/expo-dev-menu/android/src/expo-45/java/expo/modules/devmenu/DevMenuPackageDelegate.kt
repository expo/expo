package expo.modules.devmenu

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.ViewGroup
import com.facebook.react.ReactApplication
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.devmenu.react.DevMenuAwareReactActivity

object DevMenuPackageDelegate {
  // Backwards compatibility -- if the MainActivity is already an instance of
  // DevMenuAwareReactActivity, we just skip auto-setup in this case.
  fun shouldEnableAutoSetup(activityContext: Context?): Boolean =
    !(activityContext != null && activityContext is DevMenuAwareReactActivity)

  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    if (!shouldEnableAutoSetup(activityContext)) {
      return emptyList()
    }

    return listOf(
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
  }

  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    if (!shouldEnableAutoSetup(activityContext)) {
      return emptyList()
    }

    return listOf(
      object : ReactActivityHandler {
        override fun createReactRootViewContainer(activity: Activity): ViewGroup {
          return DevMenuReactRootViewContainer(activity as Context)
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          return DevMenuManager.onKeyEvent(keyCode, event)
        }
      }
    )
  }
}
