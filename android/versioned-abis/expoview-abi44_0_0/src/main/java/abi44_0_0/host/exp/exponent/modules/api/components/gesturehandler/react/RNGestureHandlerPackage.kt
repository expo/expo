package abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler.react

import abi44_0_0.com.facebook.react.ReactPackage
import abi44_0_0.com.facebook.react.bridge.NativeModule
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi44_0_0.com.facebook.react.uimanager.ViewManager
import java.util.*

class RNGestureHandlerPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) =
    listOf<NativeModule>(RNGestureHandlerModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf<ViewManager<*, *>>(
      RNGestureHandlerRootViewManager(),
      RNGestureHandlerButtonViewManager()
    )
}
