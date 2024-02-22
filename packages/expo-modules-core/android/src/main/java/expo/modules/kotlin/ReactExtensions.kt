package expo.modules.kotlin

import com.facebook.react.bridge.ReactContext
import expo.modules.adapters.react.NativeModulesProxy

internal fun ReactContext.getUnimoduleProxy(): NativeModulesProxy? {
  @Suppress("DEPRECATION")
  return if (!isBridgeless) {
    catalystInstance?.getNativeModule("NativeUnimoduleProxy") as? NativeModulesProxy
  } else {
    nativeModules?.find { it is NativeModulesProxy } as? NativeModulesProxy
  }
}
