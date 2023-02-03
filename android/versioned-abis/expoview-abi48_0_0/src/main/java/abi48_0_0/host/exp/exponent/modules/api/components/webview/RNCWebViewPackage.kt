package abi48_0_0.host.exp.exponent.modules.api.components.webview

import abi48_0_0.com.facebook.react.ReactPackage
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext

class RNCWebViewPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) = listOf(
    RNCWebViewModule(reactContext)
  )

  override fun createViewManagers(reactContext: ReactApplicationContext) = listOf(
    RNCWebViewManager()
  )
}
