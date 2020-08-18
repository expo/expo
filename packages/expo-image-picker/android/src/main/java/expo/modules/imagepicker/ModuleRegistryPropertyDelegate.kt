package expo.modules.imagepicker

import org.unimodules.core.ModuleRegistry

inline fun <reified T> ImagePickerModule.moduleRegistry() = moduleRegistryPropertyDelegate.getFromModuleRegistry<T>()

class ModuleRegistryPropertyDelegate {
  var moduleRegistry: ModuleRegistry? = null
    private set

  fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }

  inline fun <reified T> getFromModuleRegistry() = lazy { moduleRegistry!!.getModule(T::class.java) }
}
