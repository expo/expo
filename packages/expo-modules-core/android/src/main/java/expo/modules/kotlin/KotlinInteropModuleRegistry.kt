package expo.modules.kotlin

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise

private typealias ModuleName = String
private typealias ModuleConstants = Map<String, Any?>
private typealias ModuleMethodInfo = Map<String, Any?>

class KotlinInteropModuleRegistry(
  modulesProvider: ModulesProvider,
  legacyModuleRegistry: expo.modules.core.ModuleRegistry
) {
  private val appContext = AppContext(modulesProvider, legacyModuleRegistry)

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
}
