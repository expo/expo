package expo.modules.devmenu

import android.content.Context
import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import expo.modules.devmenu.extensions.DevMenuExtension
import expo.modules.devmenu.modules.DevMenuInternalModule
import expo.modules.devmenu.modules.DevMenuModule
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class DevMenuPackage : Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      DevMenuInternalModule(reactContext),
      DevMenuModule(reactContext),
      DevMenuPreferences(reactContext),
      DevMenuExtension(reactContext),
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
    return emptyList()
  }

  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> = DevMenuPackageDelegate.createReactActivityLifecycleListeners(activityContext)

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> = DevMenuPackageDelegate.createReactActivityHandlers(activityContext)
}
