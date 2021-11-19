package expo.modules.devmenu

import android.app.Application
import android.content.Context
import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.shell.MainReactPackage
import expo.modules.devmenu.react.DevMenuReactInternalSettings
import expo.modules.devmenu.safearea.MockedSafeAreaPackage
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStreamReader

/**
 * Class that represents react host used by dev menu.
 */
class DevMenuHost(application: Application) : ReactNativeHost(application) {

  override fun getPackages() = listOf(
    MainReactPackage(null),
    DevMenuPackage(),
    getVendoredPackage("com.swmansion.reanimated.ReanimatedPackage"),
    getVendoredPackage("com.swmansion.gesturehandler.react.RNGestureHandlerPackage"),
    MockedSafeAreaPackage()
  )

  override fun getJSIModulePackage(): JSIModulePackage {
    return getVendoredJNIPackage("com.swmansion.reanimated.ReanimatedJSIModulePackage")
  }

  override fun getUseDeveloperSupport() = false // change it and run `yarn start` in `expo-dev-menu` to launch dev menu from local packager

  override fun getBundleAssetName() = "EXDevMenuApp.android.js"

  override fun getJSMainModuleName() = "index"

  fun getContext(): Context = super.getApplication()

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
}
