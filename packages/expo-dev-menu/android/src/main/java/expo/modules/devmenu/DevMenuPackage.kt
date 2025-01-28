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
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class DevMenuPackage : Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return emptyList()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
    return emptyList()
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ReactActivityLifecycleListener {
        override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
          if (!DevMenuManager.isInitialized()) {
            DevMenuManager.initializeWithReactHost(
              ReactHostWrapper(
                reactNativeHost = (activity.application as ReactApplication).reactNativeHost,
                reactHostProvider = { (activity.application as ReactApplication).reactHost }
              )
            )
          } else {
            DevMenuManager.synchronizeDelegate()
          }
        }
      }
    )
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    if (!BuildConfig.DEBUG) {
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
