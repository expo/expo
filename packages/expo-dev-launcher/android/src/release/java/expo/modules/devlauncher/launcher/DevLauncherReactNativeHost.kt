package expo.modules.devlauncher.launcher

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import expo.modules.devlauncher.DEV_LAUNCHER_IS_NOT_AVAILABLE

class DevLauncherReactNativeHost(application: Application, launcherIp: String?) : ReactNativeHost(application) {
  override fun getPackages(): MutableList<ReactPackage> {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }

  override fun getUseDeveloperSupport(): Boolean {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }
}
