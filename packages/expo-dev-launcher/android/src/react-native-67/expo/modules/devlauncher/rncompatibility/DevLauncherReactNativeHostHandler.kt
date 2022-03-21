package expo.modules.devlauncher.rncompatibility

import com.facebook.react.devsupport.DevSupportManagerFactory
import expo.modules.core.interfaces.ReactNativeHostHandler

class DevLauncherReactNativeHostHandler : ReactNativeHostHandler {
  override fun getDevSupportManagerFactory(): DevSupportManagerFactory {
    return DevLauncherDevSupportManagerFactory()
  }
}
