package expo.modules.devlauncher.launcher

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.shell.MainReactPackage
import expo.modules.devlauncher.DevLauncherPackage
import expo.modules.devlauncher.R
import expo.modules.devlauncher.helpers.findDevMenuPackage
import expo.modules.devlauncher.helpers.injectDebugServerHost
import org.apache.commons.io.IOUtils
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class DevLauncherClientHost(
  application: Application,
  private val launcherIp: String?
) : ReactNativeHost(application) {

  init {
    if (useDeveloperSupport) {
      injectDebugServerHost(application.applicationContext, this, launcherIp!!, jsMainModuleName)
    }
  }

  override fun getUseDeveloperSupport() = launcherIp != null

  override fun getPackages() = listOfNotNull(
    MainReactPackage(null),
    DevLauncherPackage(),
    findDevMenuPackage()
  )

  override fun getJSMainModuleName() = "index"

  override fun getBundleAssetName() = "expo_dev_launcher_android.bundle"
}
