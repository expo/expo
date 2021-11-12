package expo.modules.kotlin

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ViewManager
import expo.modules.kotlin.views.GroupViewManagerWrapper
import expo.modules.kotlin.views.SimpleViewManagerWrapper
import expo.modules.kotlin.views.ViewManagerWrapperDelegate
import java.lang.ref.WeakReference

private typealias ModuleName = String
private typealias ModuleConstants = Map<String, Any?>
private typealias ModuleMethodInfo = Map<String, Any?>

class KotlinInteropModuleRegistry(
  modulesProvider: ModulesProvider,
  legacyModuleRegistry: expo.modules.core.ModuleRegistry,
  reactContext: WeakReference<ReactApplicationContext>
) {
  private val appContext = AppContext(modulesProvider, legacyModuleRegistry, reactContext)
  private val exportedViewManagerNames = mutableListOf<String>()

  private val registry: ModuleRegistry
    get() = appContext.registry

  fun hasModule(name: String): Boolean = registry.hasModule(name)

  fun callMethod(moduleName: String, method: String, arguments: ReadableArray, promise: Promise) {
    registry
      .getModuleHolder(moduleName)
      ?.call(method, arguments, promise)
  }

  fun exportedModulesConstants(): Map<ModuleName, ModuleConstants> {
    return registry
      .map { holder ->
        holder.name to holder.definition.constantsProvider()
      }
      .toMap()
  }

  fun exportMethods(exportKey: (String, List<ModuleMethodInfo>) -> Unit = { _, _ -> }): Map<ModuleName, List<ModuleMethodInfo>> {
    return registry
      .map { holder ->
        val methodsInfo = holder.definition.methods.map { (name, method) ->
          mapOf(
            "name" to name,
            "argumentsCount" to method.argsCount
          )
        }
        exportKey(holder.name, methodsInfo)
        holder.name to methodsInfo
      }
      .toMap()
  }

  fun exportViewManagers(): List<ViewManager<*, *>> {
    return registry
      .filter { it.definition.viewManagerDefinition != null }
      .map {
        val wrapperDelegate = ViewManagerWrapperDelegate(it)
        registerViewManagerWrapperDelegate(wrapperDelegate)
        when (it.definition.viewManagerDefinition!!.getViewManagerType()) {
          expo.modules.core.ViewManager.ViewManagerType.SIMPLE -> SimpleViewManagerWrapper(wrapperDelegate)
          expo.modules.core.ViewManager.ViewManagerType.GROUP -> GroupViewManagerWrapper(wrapperDelegate)
        }
      }
  }

  fun exportedViewManagersNames(): List<String> = exportedViewManagerNames

  fun onDestroy() {
    appContext.onDestroy()
  }

  private fun registerViewManagerWrapperDelegate(viewManagerWrapperDelegate: ViewManagerWrapperDelegate) {
    exportedViewManagerNames.add(viewManagerWrapperDelegate.name)
  }
}
