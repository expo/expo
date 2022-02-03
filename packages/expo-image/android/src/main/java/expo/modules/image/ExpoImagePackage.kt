package expo.modules.image

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ExpoImagePackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(ExpoImageModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext) = listOf<ViewManager<*, *>>(ExpoImageViewManager(reactContext))
}
