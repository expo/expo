package expo.modules.developmentclient

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import expo.modules.developmentclient.modules.DevelopmentClientDevMenuExtensions
import expo.modules.developmentclient.modules.DevelopmentClientModule

class DevelopmentClientPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      DevelopmentClientModule(reactContext),
      DevelopmentClientDevMenuExtensions(reactContext)
    )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
