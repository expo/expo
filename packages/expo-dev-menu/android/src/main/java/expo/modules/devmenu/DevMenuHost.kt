package expo.modules.devmenu

import android.app.Application
import android.content.Context
import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.devsupport.DevServerHelper
import expo.modules.devmenu.react.ReactInternalSettings
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStreamReader

class DevMenuHost(application: Application) : ReactNativeHost(application) {
  private lateinit var reactPackages: List<ReactPackage>

  fun setPackages(packages: List<ReactPackage>) {
    reactPackages = packages
  }

  override fun getPackages() = reactPackages.toMutableList()

  override fun getUseDeveloperSupport() = BuildConfig.DEBUG

  override fun getBundleAssetName() = "EXDevMenuApp.android.js"

  override fun getJSMainModuleName() = "index"

  fun getContext(): Context = super.getApplication()

  override fun createReactInstanceManager(): ReactInstanceManager {
    val reactInstanceManager = super.createReactInstanceManager()
    if (useDeveloperSupport) {
      try {
        val serverIp = BufferedReader(
          InputStreamReader(super.getApplication().assets.open("dev-menu-packager-host"))
        ).use {
          it.readLine()
        }

        val devMenuInternalReactSettings = ReactInternalSettings(serverIp, super.getApplication())

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

      } catch (e: FileNotFoundException) {
        Log.e("DevMenu", "Couldn't find `dev-menu-packager-host`.", e)
      } catch (e: Exception) {
        Log.e("DevMenu", "Couldn't inject DevSettings object.", e)
      }
    }

    return reactInstanceManager
  }

  private fun setPrivateField(obj: Any, objClass: Class<*>, field: String, newValue: Any) =
    objClass.getDeclaredField(field).run {
      isAccessible = true
      set(obj, newValue)
    }

  private inline fun <reified T> getPrivateFiled(obj: Any, objClass: Class<*>, field: String) =
    objClass.getDeclaredField(field).run {
      isAccessible = true
      get(obj) as T
    }
}
