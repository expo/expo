package expo.modules.kotlin

import expo.modules.kotlin.modules.Module

class ModuleRegistry : Iterable<ModuleHolder> {
  private val registry = mutableMapOf<String, ModuleHolder>()

  fun register(module: Module) {
    val holder = ModuleHolder(module)
    registry[holder.name] = holder
  }

  fun register(provider: ModulesProvider) = apply {
    provider.getModulesList().forEach { type ->
      val module = type.newInstance()
      register(module)
    }
  }

  fun hasModule(name: String): Boolean = registry.containsKey(name)

  fun getModule(name: String): Module? = registry[name]?.module

  fun getModuleHolder(name: String): ModuleHolder? = registry[name]

  override fun iterator(): Iterator<ModuleHolder> = registry.values.iterator()
}
