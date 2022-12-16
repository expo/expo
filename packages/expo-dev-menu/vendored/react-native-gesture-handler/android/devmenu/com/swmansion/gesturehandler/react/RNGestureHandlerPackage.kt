package devmenu.com.swmansion.gesturehandler.react

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import java.util.*

class RNGestureHandlerPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) =
    listOf<NativeModule>(RNGestureHandlerModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    listOf<ViewManager<*, *>>(
      RNGestureHandlerRootViewManager(),
      RNGestureHandlerButtonViewManager())
}
