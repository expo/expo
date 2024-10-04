package abi49_0_0.expo.modules.kotlin.modules

import android.os.Bundle
import abi49_0_0.expo.modules.kotlin.AppContext
import abi49_0_0.expo.modules.kotlin.providers.AppContextProvider
import abi49_0_0.expo.modules.kotlin.tracing.trace
import kotlinx.coroutines.CoroutineScope

abstract class Module : AppContextProvider {

  // region AppContextProvider

  @Suppress("PropertyName")
  internal var _appContext: AppContext? = null

  override val appContext: AppContext
    get() = requireNotNull(_appContext) { "The module wasn't created! You can't access the app context." }

  // endregion

  private val moduleEventEmitter by lazy { appContext.eventEmitter(this) }

  @Suppress("PropertyName")
  @PublishedApi
  internal lateinit var coroutineScopeDelegate: Lazy<CoroutineScope>

  fun sendEvent(name: String, body: Bundle? = Bundle.EMPTY) {
    moduleEventEmitter?.emit(name, body)
  }

  fun sendEvent(name: String, body: Map<String, Any?>?) {
    moduleEventEmitter?.emit(name, body)
  }

  abstract fun definition(): ModuleDefinitionData
}

@Suppress("FunctionName")
inline fun Module.ModuleDefinition(crossinline block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinitionData {
  return trace("${this.javaClass}.ModuleDefinition") { ModuleDefinitionBuilder(this).also(block).buildModule() }
}
