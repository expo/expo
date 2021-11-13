package expo.modules.kotlin.modules

import android.os.Bundle
import expo.modules.kotlin.AppContext

abstract class Module {
  internal var _appContext: AppContext? = null

  private val moduleEventEmitter by lazy { appContext.eventEmitter(this) }

  val appContext: AppContext
    get() = requireNotNull(_appContext) { "The module wasn't created! You can't access the app context." }

  fun sendEvent(name: String, body: Bundle?) {
    moduleEventEmitter?.emit(name, body)
  }

  abstract fun definition(): ModuleDefinition
}

inline fun module(block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinition {
  return ModuleDefinitionBuilder().also(block).build()
}
