package expo.modules.devlauncher.rncompatibility

import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devlauncher.DevLauncherController

class DevLauncherReactNativeHostHandler : ReactNativeHostHandler {
  override fun getDevSupportManagerFactory(): Any? {
    return null
  }

  override fun getUseDeveloperSupport(): Boolean? {
    return if (DevLauncherController.wasInitialized()) DevLauncherController.instance.useDeveloperSupport else null
  }
}

