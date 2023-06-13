package abi47_0_0.com.swmansion.gesturehandler

import abi47_0_0.com.facebook.react.ReactPackage
import abi47_0_0.com.facebook.react.bridge.NativeModule
import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi47_0_0.com.facebook.react.uimanager.ViewManager
import abi47_0_0.com.swmansion.gesturehandler.react.RNGestureHandlerButtonViewManager
import abi47_0_0.com.swmansion.gesturehandler.react.RNGestureHandlerModule
import abi47_0_0.com.swmansion.gesturehandler.react.RNGestureHandlerRootViewManager

class RNGestureHandlerPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf<NativeModule>(RNGestureHandlerModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf<ViewManager<*, *>>(
      RNGestureHandlerRootViewManager(),
      RNGestureHandlerButtonViewManager()
    )
}
