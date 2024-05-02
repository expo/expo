package expo.modules.kotlin

import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import expo.modules.adapters.react.NativeModulesProxy

internal fun ReactContext.getUnimoduleProxy(): NativeModulesProxy? {
  @Suppress("DEPRECATION")
  return if (!isBridgeless) {
    catalystInstance?.getNativeModule("NativeUnimoduleProxy") as? NativeModulesProxy
  } else {
    (this as ThemedReactContext).reactApplicationContext.nativeModules?.find { it is NativeModulesProxy } as? NativeModulesProxy
  }
}
