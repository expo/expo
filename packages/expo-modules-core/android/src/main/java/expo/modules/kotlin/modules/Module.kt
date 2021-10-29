package expo.modules.kotlin.modules

import expo.modules.kotlin.AppContext

abstract class Module {
  internal var _appContext: AppContext? = null

  val appContext: AppContext
    get() = requireNotNull(_appContext) { "The module wasn't created! You can't access the app context." }

  abstract fun definition(): ModuleDefinition
}

inline fun module(block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinition {
  return ModuleDefinitionBuilder().also(block).build()
}
