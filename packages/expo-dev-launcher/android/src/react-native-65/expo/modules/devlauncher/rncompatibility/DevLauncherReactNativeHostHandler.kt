package expo.modules.devlauncher.rncompatibility

import expo.modules.core.interfaces.ReactNativeHostHandler

class DevLauncherReactNativeHostHandler : ReactNativeHostHandler {
  override fun getDevSupportManagerFactory(): Any? {
    return null
  }
}

