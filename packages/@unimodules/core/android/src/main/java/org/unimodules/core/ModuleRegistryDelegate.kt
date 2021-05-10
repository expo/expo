package org.unimodules.core

class ModuleRegistryDelegate {
  var moduleRegistry: ModuleRegistry? = null
    private set

  fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }

  inline fun <reified T> getFromModuleRegistry() = lazy { moduleRegistry!!.getModule(T::class.java) }
}
