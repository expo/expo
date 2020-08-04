package versioned.host.exp.exponent.modules.api.components.webview

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext


class RNCWebViewPackage: ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) = listOf(
    RNCWebViewModule(reactContext)
  )

  override fun createViewManagers(reactContext: ReactApplicationContext) = listOf(
    RNCWebViewManager()
  )
}
