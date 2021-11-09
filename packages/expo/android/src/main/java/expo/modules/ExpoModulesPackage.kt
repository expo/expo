package expo.modules

import android.util.Log

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

import expo.modules.adapters.react.ModuleRegistryAdapter
import expo.modules.core.ModulePriorities
import expo.modules.core.interfaces.Package

import java.lang.Exception

class ExpoModulesPackage : ReactPackage {
  val moduleRegistryAdapter = ModuleRegistryAdapter(packageList)

  companion object {
    @Suppress("unchecked_cast")
    val packageList: List<Package> by lazy {
      try {
        val expoModules = Class.forName("expo.modules.ExpoModulesPackageList")
        val getPackageList = expoModules.getMethod("getPackageList")
        (getPackageList.invoke(null) as List<Package>)
          .sortedByDescending { ModulePriorities.get(it::class.qualifiedName) }
      } catch (e: Exception) {
        Log.e("ExpoModulesPackage", "Couldn't get expo package list.", e)
        emptyList()
      }
    }
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return moduleRegistryAdapter.createNativeModules(reactContext)
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return moduleRegistryAdapter.createViewManagers(reactContext)
  }
}
