package expo.modules.devlauncher.launcher

import android.app.Application
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import devmenu.com.th3rdwave.safeareacontext.SafeAreaProviderManager
import expo.modules.adapters.react.ModuleRegistryAdapter
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.DevLauncherPackage
import expo.modules.devlauncher.helpers.findDevMenuPackage
import expo.modules.devlauncher.helpers.injectDebugServerHost
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.devmenu.react.createNonDebuggableJavaScriptExecutorFactory
import expo.modules.kotlin.ModulesProvider

class DevLauncherReactNativeHost(
  application: Application,
  private val launcherIp: String?
) : DefaultReactNativeHost(application) {

  init {
    if (useDeveloperSupport) {
      injectDebugServerHost(application.applicationContext, this, launcherIp!!, jsMainModuleName)
    }
  }

  override fun getUseDeveloperSupport() = launcherIp != null

  override fun getPackages(): List<ReactPackage> {
    val devMenuRelatedPackages: List<ReactPackage> =
      findDevMenuPackage()?.let { listOf(it) } ?: emptyList()

    val additionalPackages = (DevLauncherController.sAdditionalPackages ?: emptyList())

    return listOf(
      MainReactPackage(null),
      ModuleRegistryAdapter(
        ReactModuleRegistryProvider(emptyList()),
        object : ModulesProvider {
          override fun getModulesList() =
            listOf(
              DevMenuPreferences::class.java,
              SafeAreaProviderManager::class.java
            )
        }
      ),
      DevLauncherPackage()
    ) +
      devMenuRelatedPackages +
      additionalPackages
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory {
    return createNonDebuggableJavaScriptExecutorFactory(application)
  }

  override fun getJSMainModuleName() = "index"

  override fun getBundleAssetName() = "expo_dev_launcher_android.bundle"
}
