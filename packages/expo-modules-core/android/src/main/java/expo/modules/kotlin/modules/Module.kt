package expo.modules.kotlin.modules

import android.os.Bundle
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.kotlin.AppContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel

abstract class Module {
  @Suppress("PropertyName")
  internal var _appContext: AppContext? = null

  private val moduleEventEmitter by lazy { appContext.eventEmitter(this) }

  val appContext: AppContext
    get() = requireNotNull(_appContext) { "The module wasn't created! You can't access the app context." }

  @Suppress("PropertyName")
  @PublishedApi
  internal lateinit var coroutineScopeDelegate: Lazy<CoroutineScope>
  val coroutineScope get() = coroutineScopeDelegate.value

  fun sendEvent(name: String, body: Bundle?) {
    moduleEventEmitter?.emit(name, body)
  }

  abstract fun definition(): ModuleDefinitionData

  internal fun cleanUp() {
    if (coroutineScopeDelegate.isInitialized()) {
      coroutineScope.cancel(ModuleDestroyedException())
    }
  }
}

@Suppress("FunctionName")
inline fun Module.ModuleDefinition(block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinitionData {
  return ModuleDefinitionBuilder(this).also(block).build()
}
