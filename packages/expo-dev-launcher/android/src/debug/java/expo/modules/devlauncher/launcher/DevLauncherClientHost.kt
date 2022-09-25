package expo.modules.devlauncher.launcher

import android.app.Application
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.jscexecutor.JSCExecutorFactory
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.DevLauncherPackage
import expo.modules.devlauncher.helpers.findDevMenuPackage
import expo.modules.devlauncher.helpers.findPackagesWithDevMenuExtension
import expo.modules.devlauncher.helpers.injectDebugServerHost
import devmenu.com.th3rdwave.safeareacontext.SafeAreaContextPackage
import devmenu.com.swmansion.gesturehandler.react.RNGestureHandlerPackage

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

  override fun getPackages(): List<ReactPackage> {
    val devMenuPackage = findDevMenuPackage()
    val devMenuRelatedPackages: List<ReactPackage> =
      if (devMenuPackage != null) {
        findPackagesWithDevMenuExtension(this) + devMenuPackage
      } else {
        emptyList()
      }

    val additionalPackages = (DevLauncherController.sAdditionalPackages ?: emptyList())

    return listOf(
      MainReactPackage(null),
      DevLauncherPackage(),
      RNGestureHandlerPackage(),
      SafeAreaContextPackage(),
    ) +
      devMenuRelatedPackages +
      additionalPackages
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    SoLoader.init(application.applicationContext, /* native exopackage */ false)
    if (SoLoader.getLibraryPath("libjsc.so") != null) {
      return JSCExecutorFactory(application.packageName, AndroidInfoHelpers.getFriendlyDeviceName())
    }
    return HermesExecutorFactory()
  }

  override fun getJSMainModuleName() = "index"

  override fun getBundleAssetName() = "expo_dev_launcher_android.bundle"
}
