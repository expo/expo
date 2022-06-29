package versioned.host.exp.exponent.modules.api.components.gesturehandler

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.soloader.SoLoader
import versioned.host.exp.exponent.modules.api.components.gesturehandler.BuildConfig
import versioned.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule
import versioned.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerRootViewManager
import versioned.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerButtonViewManager

class RNGestureHandlerPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // For Fabric, we load c++ native library here, this triggers gesture handler's
      // Fabric component registration which is necessary in order to avoid asking users
      // to manually add init calls in their application code.
      // This should no longer be needed if RN's autolink mechanism has Fabric support
      SoLoader.loadLibrary("rngesturehandler_modules")
    }
    return listOf<NativeModule>(RNGestureHandlerModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf<ViewManager<*, *>>(
      RNGestureHandlerRootViewManager(),
      RNGestureHandlerButtonViewManager())
}
