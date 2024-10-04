package expo.modules.devlauncher.launcher

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.shell.MainReactPackage
import devmenu.com.swmansion.gesturehandler.react.RNGestureHandlerPackage
import devmenu.com.th3rdwave.safeareacontext.SafeAreaContextPackage
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.DevLauncherPackage
import expo.modules.devlauncher.helpers.findDevMenuPackage
import expo.modules.devlauncher.helpers.findPackagesWithDevMenuExtension
import expo.modules.devlauncher.helpers.injectDebugServerHost
import expo.modules.devmenu.react.createNonDebuggableJavaScriptExecutorFactory

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
    return createNonDebuggableJavaScriptExecutorFactory(application)
  }

  override fun getJSMainModuleName() = "index"

  override fun getBundleAssetName() = "expo_dev_launcher_android.bundle"

  override fun getReactPackageTurboModuleManagerDelegateBuilder(): ReactPackageTurboModuleManagerDelegate.Builder? {
    if (!ReactFeatureFlags.useTurboModules) {
      return null
    }
    val appHost = (application as ReactApplication)?.reactNativeHost ?: return null
    val method = ReactNativeHost::class.java.getDeclaredMethod("getReactPackageTurboModuleManagerDelegateBuilder")
    method.isAccessible = true
    return method.invoke(appHost) as ReactPackageTurboModuleManagerDelegate.Builder
  }
}
