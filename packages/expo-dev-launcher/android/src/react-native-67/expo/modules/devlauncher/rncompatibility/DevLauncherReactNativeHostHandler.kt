package expo.modules.devlauncher.rncompatibility

import com.facebook.react.devsupport.DevSupportManagerFactory
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devlauncher.DevLauncherController

class DevLauncherReactNativeHostHandler : ReactNativeHostHandler {
  override fun getDevSupportManagerFactory(): DevSupportManagerFactory {
    return DevLauncherDevSupportManagerFactory()
  }

  override fun getUseDeveloperSupport(): Boolean? {
    return if (DevLauncherController.wasInitialized()) DevLauncherController.instance.useDeveloperSupport else null
  }
}
