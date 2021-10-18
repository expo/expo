package expo.modules.kotlin

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import kotlin.reflect.full.companionObject
import kotlin.reflect.full.companionObjectInstance
import kotlin.reflect.full.isSubclassOf


class ModuleRegistry : Iterable<ModuleHolder> {
  private val registry = mutableMapOf<String, ModuleHolder>()

  fun register(definition: ModuleDefinition) = apply {
    registry[definition.name] = ModuleHolder(definition)
  }

  fun register(provider: ModulesProvider) = apply {
    provider.getModulesList().forEach { type ->
      val definitionProvider = getModuleDefinitionProvider(type) ?: return@forEach
      val definition = definitionProvider
          .definition()
          .associateWithType(type)
      register(definition)
    }
  }

  fun hasModule(name: String): Boolean = registry.containsKey(name)

  fun getModule(name: String): Module? = registry[name]?.module

  fun getModuleHolder(name: String): ModuleHolder? = registry[name]

  private fun getModuleDefinitionProvider(moduleClass: Class<out Module>): Module.ModuleDefinitionProvider? {
    val ktType = moduleClass.kotlin
    if (ktType.companionObject?.isSubclassOf(Module.ModuleDefinitionProvider::class) == true) {
      return ktType.companionObjectInstance as? Module.ModuleDefinitionProvider
    }
    return null
  }

  override fun iterator(): Iterator<ModuleHolder> {
    return this.registry.values.iterator()
  }
}
