package abi43_0_0.expo.modules

import android.util.Log

import abi43_0_0.com.facebook.react.ReactPackage
import abi43_0_0.com.facebook.react.bridge.NativeModule
import abi43_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi43_0_0.com.facebook.react.uimanager.ViewManager

import abi43_0_0.expo.modules.adapters.react.ModuleRegistryAdapter
import abi43_0_0.expo.modules.core.interfaces.Package

import java.lang.Exception

class ExpoModulesPackage : ReactPackage {
  val moduleRegistryAdapter = ModuleRegistryAdapter(packageList)

  companion object {
    @Suppress("unchecked_cast")
    val packageList: List<Package> by lazy {
      try {
        val expoModules = Class.forName("expo.modules.ExpoModulesPackageList")
        val getPackageList = expoModules.getMethod("getPackageList")
        getPackageList.invoke(null) as List<Package>
      } catch (e: Exception) {
        Log.e("ExpoModulesPackage", "Couldn't get abi43_0_0.expo.modules list.", e)
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
