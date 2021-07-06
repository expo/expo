package abi41_0_0.expo.modules.imagepicker

import abi41_0_0.org.unimodules.core.ModuleRegistry

inline fun <reified T> ImagePickerModule.moduleRegistry() = moduleRegistryPropertyDelegate.getFromModuleRegistry<T>()

class ModuleRegistryPropertyDelegate {
  var moduleRegistry: ModuleRegistry? = null
    private set

  fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }

  inline fun <reified T> getFromModuleRegistry() = lazy { moduleRegistry!!.getModule(T::class.java) }
}
