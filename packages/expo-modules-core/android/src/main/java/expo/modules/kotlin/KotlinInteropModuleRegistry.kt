package expo.modules.kotlin

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import expo.modules.adapters.react.NativeModulesProxy
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.DEFAULT_MODULE_VIEW
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.views.ViewManagerWrapperDelegate
import java.lang.ref.WeakReference

class KotlinInteropModuleRegistry(
  modulesProvider: ModulesProvider,
  legacyModuleRegistry: expo.modules.core.ModuleRegistry,
  reactContext: WeakReference<ReactApplicationContext>
) {
  val appContext = AppContext(
    modulesProvider,
    legacyModuleRegistry,
    reactContext
  )

  private val registry: ModuleRegistry
    get() = appContext.registry

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

  fun exportViewManagerDelegates(): List<ViewManagerWrapperDelegate> =
    trace("KotlinInteropModuleRegistry.exportViewManagerDelegates") {
      registry
        .flatMap { module ->
          module.definition.viewManagerDefinitions.map { (name, definition) ->
            ViewManagerWrapperDelegate(module, definition, if (name == DEFAULT_MODULE_VIEW) module.name else null)
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

  /**
   * Since React Native v0.55, {@link com.facebook.react.ReactPackage#createViewManagers(ReactApplicationContext)}
   * gets called only once per lifetime of {@link com.facebook.react.ReactInstanceManager}.
   * However, in our new architecture, users can make a bind between ViewManager and module
   * (for instance, they can use `this` in prop definition). This will lead to bugs, cause
   * the instance that was bound with the prop method won't be the same as the instance returned by module registry.
   * To fix that we need to update all modules holder in exported view managers.
   */
  fun updateModuleHoldersInViewDelegates(viewDelegates: List<ViewManagerWrapperDelegate>) =
    trace("KotlinInteropModuleRegistry.updateModuleHoldersInViewDelegates") {
      viewDelegates
        .forEach { delegate ->
          delegate.moduleHolder = requireNotNull(registry.getModuleHolder(delegate.moduleHolder.name)) {
            "Cannot update the module holder for ${delegate.moduleHolder.name}."
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
