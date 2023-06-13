package abi47_0_0.expo.modules.kotlin

import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.com.facebook.react.uimanager.ViewManager
import abi47_0_0.expo.modules.adapters.react.NativeModulesProxy
import abi47_0_0.expo.modules.kotlin.defaultmodules.NativeModulesProxyModuleName
import abi47_0_0.expo.modules.kotlin.exception.CodedException
import abi47_0_0.expo.modules.kotlin.exception.UnexpectedException
import abi47_0_0.expo.modules.kotlin.views.GroupViewManagerWrapper
import abi47_0_0.expo.modules.kotlin.views.SimpleViewManagerWrapper
import abi47_0_0.expo.modules.kotlin.views.ViewManagerWrapperDelegate
import abi47_0_0.expo.modules.kotlin.views.ViewWrapperDelegateHolder
import java.lang.ref.WeakReference

private typealias ModuleName = String
private typealias ModuleConstants = Map<String, Any?>
private typealias ModuleMethodInfo = Map<String, Any?>

class KotlinInteropModuleRegistry(
  modulesProvider: ModulesProvider,
  legacyModuleRegistry: abi47_0_0.expo.modules.core.ModuleRegistry,
  reactContext: WeakReference<ReactApplicationContext>
) {
  internal val appContext = AppContext(modulesProvider, legacyModuleRegistry, reactContext)

  private val registry: ModuleRegistry
    get() = appContext.registry

  fun hasModule(name: String): Boolean = registry.hasModule(name)

  fun callMethod(moduleName: String, method: String, arguments: ReadableArray, promise: Promise) {
    try {
      requireNotNull(
        registry.getModuleHolder(moduleName)
      ) { "Trying to call '$method' on the non-existing module '$moduleName'" }
        .call(method, arguments, promise)
    } catch (e: CodedException) {
      promise.reject(e)
    } catch (e: Throwable) {
      promise.reject(UnexpectedException(e))
    }
  }

  fun exportedModulesConstants(): Map<ModuleName, ModuleConstants> {
    return registry
      // prevent infinite recursion - exclude NativeProxyModule constants
      .filter { holder -> holder.name != NativeModulesProxyModuleName }
      .associate { holder ->
        holder.name to holder.definition.constantsProvider()
      }
  }

  fun exportMethods(exportKey: (String, List<ModuleMethodInfo>) -> Unit = { _, _ -> }): Map<ModuleName, List<ModuleMethodInfo>> {
    return registry.associate { holder ->
      val methodsInfo = holder
        .definition
        .asyncFunctions
        .map { (name, method) ->
          mapOf(
            "name" to name,
            "argumentsCount" to method.argsCount
          )
        }
      exportKey(holder.name, methodsInfo)
      holder.name to methodsInfo
    }
  }

  fun exportViewManagers(): List<ViewManager<*, *>> {
    return registry
      .filter { it.definition.viewManagerDefinition != null }
      .map {
        val wrapperDelegate = ViewManagerWrapperDelegate(it)
        when (it.definition.viewManagerDefinition!!.getViewManagerType()) {
          abi47_0_0.expo.modules.core.ViewManager.ViewManagerType.SIMPLE -> SimpleViewManagerWrapper(wrapperDelegate)
          abi47_0_0.expo.modules.core.ViewManager.ViewManagerType.GROUP -> GroupViewManagerWrapper(wrapperDelegate)
        }
      }
  }

  fun viewManagersMetadata(): Map<String, Map<String, Any>> {
    return registry
      .filter { it.definition.viewManagerDefinition != null }
      .associate { holder ->
        holder.name to mapOf(
          "propsNames" to (holder.definition.viewManagerDefinition?.propsNames ?: emptyList())
        )
      }
  }

  fun extractViewManagersDelegateHolders(viewManagers: List<ViewManager<*, *>>): List<ViewWrapperDelegateHolder> =
    viewManagers.filterIsInstance<ViewWrapperDelegateHolder>()

  /**
   * Since React Native v0.55, {@link abi47_0_0.com.facebook.react.ReactPackage#createViewManagers(ReactApplicationContext)}
   * gets called only once per lifetime of {@link abi47_0_0.com.facebook.react.ReactInstanceManager}.
   * However, in our new architecture, users can make a bind between ViewManager and module
   * (for instance, they can use `this` in prop definition). This will lead to bugs, cause
   * the instance that was bound with the prop method won't be the same as the instance returned by module registry.
   * To fix that we need to update all modules holder in exported view managers.
   */
  fun updateModuleHoldersInViewManagers(viewWrapperHolders: List<ViewWrapperDelegateHolder>) {
    viewWrapperHolders
      .map { it.viewWrapperDelegate }
      .forEach { holderWrapper ->
        holderWrapper.moduleHolder = requireNotNull(registry.getModuleHolder(holderWrapper.moduleHolder.name)) {
          "Cannot update the module holder for ${holderWrapper.moduleHolder.name}."
        }
      }
  }

  fun onDestroy() {
    appContext.onDestroy()
    logger.info("✅ KotlinInteropModuleRegistry was destroyed")
  }

  fun installJSIInterop() {
    appContext.installJSIInterop()
  }

  fun setLegacyModulesProxy(proxyModule: NativeModulesProxy) {
    appContext.legacyModulesProxyHolder = WeakReference(proxyModule)
  }
}
