package expo.modules.kotlin.modules

open class Module {
  interface ModuleDefinitionProvider {
    fun definition(): ModuleDefinition
  }
}

fun module(block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinition {
  return ModuleDefinitionBuilder().also(block).build()
}
