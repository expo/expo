package expo.modules.kotlin.modules

abstract class Module {
  abstract fun definition(): ModuleDefinition
}

inline fun module(block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinition {
  return ModuleDefinitionBuilder().also(block).build()
}
