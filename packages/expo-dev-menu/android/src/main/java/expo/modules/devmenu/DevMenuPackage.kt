package expo.modules.devmenu

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import expo.modules.devmenu.extensions.DevMenuExtension
import expo.modules.devmenu.modules.DevMenuInternalModule
import expo.modules.devmenu.modules.DevMenuManagerProvider
import expo.modules.devmenu.modules.DevMenuModule
import expo.modules.devmenu.modules.DevMenuSettings
import expo.modules.core.interfaces.Package

class DevMenuPackage: Package, ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      DevMenuInternalModule(reactContext),
      DevMenuModule(reactContext),
      DevMenuSettings(reactContext),
      DevMenuManagerProvider(),
      DevMenuExtension(reactContext),
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
    return emptyList()
  }
}
