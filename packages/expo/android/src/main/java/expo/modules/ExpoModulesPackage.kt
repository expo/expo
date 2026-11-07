package expo.modules

import android.util.Log

import com.facebook.react.ReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

import expo.modules.adapters.react.ModuleRegistryAdapter
import expo.modules.core.ModulePriorities
import expo.modules.core.interfaces.Package

import java.lang.Exception
import java.lang.ref.WeakReference

class ExpoModulesPackage : ReactPackage, ViewManagerOnDemandReactPackage {
  val moduleRegistryAdapter = ModuleRegistryAdapter(packageList)

  private var viewManagersContext = WeakReference<ReactApplicationContext>(null)
  private var viewManagers: Map<String, ViewManager<*, *>> = emptyMap()

  companion object {
    @Suppress("unchecked_cast")
    val packageList: List<Package> by lazy {
      try {
        val expoModules = Class.forName("expo.modules.ExpoModulesPackageList")
        val getPackageList = expoModules.getMethod("getPackageList")
        (getPackageList.invoke(null) as List<Package>)
          .sortedByDescending { ModulePriorities.get(it.javaClass.canonicalName) }
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

  override fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String> {
    return getViewManagers(reactContext).keys
  }

  override fun createViewManager(
    reactContext: ReactApplicationContext,
    viewManagerName: String
  ): ViewManager<in Nothing, in Nothing>? {
    return getViewManagers(reactContext)[viewManagerName]
  }

  // Create all view managers together. This also registers the Fabric components that the
  // renderer needs before it creates the first Expo view.
  @Synchronized
  private fun getViewManagers(reactContext: ReactApplicationContext): Map<String, ViewManager<*, *>> {
    if (viewManagersContext.get() !== reactContext) {
      viewManagers = createViewManagers(reactContext).associateBy { it.name }
      viewManagersContext = WeakReference(reactContext)
    }
    return viewManagers
  }
}
