package expo.modules.devmenu

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager
import expo.modules.devmenu.extensions.DevMenuExtension
import expo.modules.devmenu.modules.DevMenuInternalModule
import expo.modules.devmenu.modules.DevMenuManagerProvider
import expo.modules.devmenu.modules.DevMenuModule
import expo.modules.devmenu.modules.DevMenuSettings

class DevMenuPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) =
    listOf(
      DevMenuInternalModule(reactContext),
      DevMenuModule(reactContext),
      DevMenuExtension(reactContext),
      DevMenuManagerProvider(),
      DevMenuSettings(reactContext)
    )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> = listOf()
}
