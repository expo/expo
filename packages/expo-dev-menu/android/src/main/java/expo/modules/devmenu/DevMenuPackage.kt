package expo.modules.devmenu

import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import expo.modules.devmenu.extensions.DevMenuExtension
import expo.modules.devmenu.modules.DevMenuInternalModule
import expo.modules.devmenu.modules.DevMenuModule
import expo.modules.devmenu.modules.DevMenuSettings
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler

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

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    val listener = object : ReactActivityHandler {
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
    return listOf(listener)
  }
}
