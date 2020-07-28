package expo.modules.imagepicker

import org.unimodules.core.ModuleRegistry

inline fun <reified T> ImagePickerModule.moduleRegistry() = moduleRegistryPropertyDelegate.getFromModuleRegistry<T>()
inline fun <reified T, U> ImagePickerModule.moduleRegistry(crossinline initializer: (module: T) -> U) = moduleRegistryPropertyDelegate.getFromModuleRegistry(initializer)

class ModuleRegistryPropertyDelegate {
  var moduleRegistry: ModuleRegistry? = null
    private set

  fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }

  inline fun <reified T> getFromModuleRegistry() = lazy { moduleRegistry!!.getModule(T::class.java) }

  inline fun <reified T, U> getFromModuleRegistry(crossinline initializer: (module: T) -> U): Lazy<U> = lazy {
    initializer(moduleRegistry!!.getModule(T::class.java))
  }
}
