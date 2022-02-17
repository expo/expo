package expo.modules.devmenu

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactApplication
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import expo.modules.devmenu.extensions.DevMenuExtension
import expo.modules.devmenu.modules.DevMenuInternalModule
import expo.modules.devmenu.modules.DevMenuModule
import expo.modules.devmenu.modules.DevMenuSettings
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityDelegateHandler
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class DevMenuPackage: Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      DevMenuInternalModule(reactContext),
      DevMenuModule(reactContext),
      DevMenuSettings(reactContext),
      DevMenuExtension(reactContext),
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
    return emptyList()
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
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

  override fun createReactActivityDelegateHandlers(activityContext: Context?): List<ReactActivityDelegateHandler> =
    listOf(
      object : ReactActivityDelegateHandler {
        override fun createReactRootView(activity: Activity): ReactRootView? {
          return DevMenuEnabledReactRootView(activity as Context)
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          return DevMenuManager.onKeyEvent(keyCode, event)
        }
      }
    )
}
