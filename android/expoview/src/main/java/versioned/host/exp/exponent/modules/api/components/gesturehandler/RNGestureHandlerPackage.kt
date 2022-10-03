package versioned.host.exp.exponent.modules.api.components.gesturehandler
import host.exp.expoview.BuildConfig

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

import versioned.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerModule
import versioned.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerRootViewManager
import versioned.host.exp.exponent.modules.api.components.gesturehandler.react.RNGestureHandlerButtonViewManager

class RNGestureHandlerPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf<NativeModule>(RNGestureHandlerModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf<ViewManager<*, *>>(
      RNGestureHandlerRootViewManager(),
      RNGestureHandlerButtonViewManager())
}
