package expo.modules.devmenu

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import com.facebook.react.ReactApplication
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.devmenu.extensions.DevMenuExtension
import expo.modules.devmenu.react.DevMenuAwareReactActivity

object DevMenuPackageDelegate {
  @JvmField
  var enableAutoSetup: Boolean? = null

  internal fun shouldEnableAutoSetup(activityContext: Context?): Boolean {
    if (enableAutoSetup != null) {
      // if someone else has set this explicitly, use that value
      return enableAutoSetup!!
    }
    if (activityContext != null && activityContext is DevMenuAwareReactActivity) {
      // Backwards compatibility -- if the MainActivity is already an instance of
      // DevMenuAwareReactActivity, we skip auto-setup.
      return false
    }
    return true
  }
}

class DevMenuPackage : Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      DevMenuExtension(reactContext),
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
    return emptyList()
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    if (!DevMenuPackageDelegate.shouldEnableAutoSetup(activityContext) || !BuildConfig.DEBUG) {
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

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    if (!DevMenuPackageDelegate.shouldEnableAutoSetup(activityContext) || !BuildConfig.DEBUG) {
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
