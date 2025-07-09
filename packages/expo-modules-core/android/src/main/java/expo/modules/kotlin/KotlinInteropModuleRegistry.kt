package expo.modules.kotlin

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ViewManager
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.DEFAULT_MODULE_VIEW
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.views.GroupViewManagerWrapper
import expo.modules.kotlin.views.SimpleViewManagerWrapper
import expo.modules.kotlin.views.ViewManagerType
import expo.modules.kotlin.views.ViewManagerWrapperDelegate
import expo.modules.kotlin.views.ViewWrapperDelegateHolder
import java.lang.ref.WeakReference

class KotlinInteropModuleRegistry(
  modulesProvider: ModulesProvider,
  legacyModuleRegistry: expo.modules.core.ModuleRegistry,
  reactContext: WeakReference<ReactApplicationContext>
) {
  val appContext = AppContext(modulesProvider, legacyModuleRegistry, reactContext)

  private val registry: ModuleRegistry
    get() = appContext.hostingRuntimeContext.registry

  fun hasModule(name: String): Boolean = registry.hasModule(name)

  fun callMethod(moduleName: String, method: String, arguments: ReadableArray, promise: Promise) {
    try {
      requireNotNull(
        registry.getModuleHolder(moduleName)
      ) { "Trying to call '$method' on the non-existing module '$moduleName'" }
        .call(method, arguments.toArrayList().toArray(), promise)
    } catch (e: CodedException) {
      promise.reject(e)
    } catch (e: Throwable) {
      promise.reject(UnexpectedException(e))
    }
  }

  fun exportViewManagers(): List<ViewManager<*, *>> =
    trace("KotlinInteropModuleRegistry.exportViewManagers") {
      registry
        .flatMap { module ->
          module.definition.viewManagerDefinitions.map { (name, definition) ->
            val wrapperDelegate = ViewManagerWrapperDelegate(module, definition, if (name == DEFAULT_MODULE_VIEW) module.name else null)
            when (definition.getViewManagerType()) {
              ViewManagerType.SIMPLE -> SimpleViewManagerWrapper(wrapperDelegate)
              ViewManagerType.GROUP -> GroupViewManagerWrapper(wrapperDelegate)
            }
          }
        }
    }

  fun viewManagersMetadata(): Map<String, Map<String, Any>> =
    trace("KotlinInteropModuleRegistry.viewManagersMetadata") {
      val result = registry.flatMap { module ->
        module.definition.viewManagerDefinitions.map { (name, definition) ->
          val viewName = if (name == DEFAULT_MODULE_VIEW) {
            module.name
          } else {
            "${module.name}_$name"
          }

          viewName to mapOf("propsNames" to definition.propsNames)
        }
      }.toMap()
      return@trace result
    }

  fun extractViewManagersDelegateHolders(viewManagers: List<ViewManager<*, *>>): List<ViewWrapperDelegateHolder> =
    trace("KotlinInteropModuleRegistry.extractViewManagersDelegateHolders") {
      viewManagers.filterIsInstance<ViewWrapperDelegateHolder>()
    }

  /**
   * Since React Native v0.55, {@link com.facebook.react.ReactPackage#createViewManagers(ReactApplicationContext)}
   * gets called only once per lifetime of {@link com.facebook.react.ReactInstanceManager}.
   * However, in our new architecture, users can make a bind between ViewManager and module
   * (for instance, they can use `this` in prop definition). This will lead to bugs, cause
   * the instance that was bound with the prop method won't be the same as the instance returned by module registry.
   * To fix that we need to update all modules holder in exported view managers.
   */
  fun updateModuleHoldersInViewManagers(viewWrapperHolders: List<ViewWrapperDelegateHolder>) =
    trace("KotlinInteropModuleRegistry.updateModuleHoldersInViewManagers") {
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

  fun emitOnCreate() {
    appContext.onCreate()
  }

  fun setLegacyModulesProxy(proxyModule: NativeModulesProxy) {
    appContext.legacyModulesProxyHolder = WeakReference(proxyModule)
  }
}
