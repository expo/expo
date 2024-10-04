package expo.modules.devmenu

import android.app.Application
import android.content.Context
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.defaults.DefaultJSIModulePackage
import com.facebook.react.devsupport.DevMenuReactInternalSettings
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.shell.MainReactPackage
import devmenu.com.th3rdwave.safeareacontext.SafeAreaProviderManager
import expo.modules.adapters.react.ModuleRegistryAdapter
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.devmenu.modules.DevMenuInternalModule
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.devmenu.react.createNonDebuggableJavaScriptExecutorFactory
import expo.modules.kotlin.ModulesProvider
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStreamReader

/**
 * Class that represents react host used by dev menu.
 */
class DevMenuHost(application: Application) : ReactNativeHost(application) {

  override fun getPackages(): List<ReactPackage> {
    val packages = mutableListOf(
      MainReactPackage(null),
      ModuleRegistryAdapter(
        ReactModuleRegistryProvider(emptyList()),
        object : ModulesProvider {
          override fun getModulesList() =
            listOf(
              DevMenuInternalModule::class.java,
              DevMenuPreferences::class.java,
              SafeAreaProviderManager::class.java
            )
        }
      ),
      DevMenuPackage(),
    )

    try {
      val devLauncherPackage = Class.forName("expo.modules.devlauncher.DevLauncherPackage")
      val pkg = devLauncherPackage.getConstructor().newInstance() as ReactPackage
      packages.add(pkg)
    } catch (e: ClassNotFoundException) {
      // dev launcher is not installed in this project
    }

    return packages
  }

  override fun getUseDeveloperSupport() = false // change it and run `yarn start` in `expo-dev-menu` to launch dev menu from local packager

  override fun getBundleAssetName() = "EXDevMenuApp.android.js"

  override fun getJSMainModuleName() = "index"

  fun getContext(): Context = super.getApplication()

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    return createNonDebuggableJavaScriptExecutorFactory(application)
  }

  override fun createReactInstanceManager(): ReactInstanceManager {
    val reactInstanceManager = super.createReactInstanceManager()

    if (useDeveloperSupport) {
      // To use a different packager url, we need to replace internal RN objects.
      try {
        val serverIp = BufferedReader(
          InputStreamReader(super.getApplication().assets.open("dev-menu-packager-host"))
        ).use {
          it.readLine()
        }

        val devMenuInternalReactSettings = DevMenuReactInternalSettings(serverIp, super.getApplication())

        val devSupportManager = reactInstanceManager.devSupportManager
        val devSupportManagerBaseClass = devSupportManager.javaClass.superclass!!
        setPrivateField(
          obj = devSupportManager,
          objClass = devSupportManagerBaseClass,
          field = "mDevSettings",
          newValue = devMenuInternalReactSettings
        )

        val devServerHelper: DevServerHelper = getPrivateFiled(devSupportManager, devSupportManagerBaseClass, "mDevServerHelper")
        setPrivateField(
          obj = devServerHelper,
          objClass = devServerHelper.javaClass,
          field = "mSettings",
          newValue = devMenuInternalReactSettings
        )

        Log.i(DEV_MENU_TAG, "DevSettings was correctly injected.")
      } catch (e: FileNotFoundException) {
        Log.e(DEV_MENU_TAG, "Couldn't find `dev-menu-packager-host` file.", e)
      } catch (e: Exception) {
        Log.e(DEV_MENU_TAG, "Couldn't inject DevSettings object.", e)
      }
    }

    return reactInstanceManager
  }

  override fun getReactPackageTurboModuleManagerDelegateBuilder(): ReactPackageTurboModuleManagerDelegate.Builder? {
    if (!ReactFeatureFlags.useTurboModules) {
      return null
    }
    val appHost = (application as ReactApplication)?.reactNativeHost ?: return null
    val method = ReactNativeHost::class.java.getDeclaredMethod("getReactPackageTurboModuleManagerDelegateBuilder")
    method.isAccessible = true
    return method.invoke(appHost) as ReactPackageTurboModuleManagerDelegate.Builder
  }
  override fun getJSIModulePackage(): JSIModulePackage? =
    if (ReactFeatureFlags.enableFabricRenderer) {
      DefaultJSIModulePackage(this)
    } else {
      null
    }
}
