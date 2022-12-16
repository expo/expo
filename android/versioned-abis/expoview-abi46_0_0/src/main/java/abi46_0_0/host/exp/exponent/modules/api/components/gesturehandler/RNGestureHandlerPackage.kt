package abi46_0_0.host.exp.exponent.modules.api.components.gesturehandler
import host.exp.expoview.BuildConfig

import abi46_0_0.com.facebook.react.ReactPackage
import abi46_0_0.com.facebook.react.bridge.NativeModule
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi46_0_0.com.facebook.react.uimanager.ViewManager
import com.facebook.soloader.SoLoader

import abi46_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule
import abi46_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerRootViewManager
import abi46_0_0.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerButtonViewManager

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
      RNGestureHandlerButtonViewManager()
    )
}
