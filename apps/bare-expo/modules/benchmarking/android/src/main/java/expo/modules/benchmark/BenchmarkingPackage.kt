package expo.modules.benchmark

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class BenchmarkingPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule?> =
    listOf(BenchmarkingBridgeModule())

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>?> =
    emptyList()
}
