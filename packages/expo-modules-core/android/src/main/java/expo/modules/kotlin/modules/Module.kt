package expo.modules.kotlin.modules

import android.os.Bundle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.CoroutineScope

abstract class Module : AppContextProvider {

  @Suppress("PropertyName")
  internal var _runtimeContext: RuntimeContext? = null

  val runtimeContext: RuntimeContext
    get() = requireNotNull(_runtimeContext) { "The module wasn't created! You can't access the runtime context." }

  // region AppContextProvider

  override val appContext: AppContext
    get() = requireNotNull(_runtimeContext?.appContext) {
      "You attempted to access the app context before the module was created. " +
        "Defer accessing the context until after the module initializes."
    }

  // endregion

  private val moduleEventEmitter by lazy { appContext.eventEmitter(this) }

  val registry
    get() = runtimeContext.registry

  @PublishedApi
  internal lateinit var coroutineScopeDelegate: Lazy<CoroutineScope>

  fun sendEvent(name: String, body: Bundle? = Bundle.EMPTY) {
    moduleEventEmitter?.emit(name, body)
  }

  fun sendEvent(name: String, body: Map<String, Any?>) {
    moduleEventEmitter?.emit(name, body)
  }

  fun <T> sendEvent(enum: T, body: Bundle? = Bundle.EMPTY) where T : Enumerable, T : Enum<T> {
    moduleEventEmitter?.emit(convertEnumToString(enum), body)
  }

  fun <T> sendEvent(enum: T, body: Map<String, Any?>? = null) where T : Enumerable, T : Enum<T> {
    moduleEventEmitter?.emit(convertEnumToString(enum), body)
  }

  abstract fun definition(): ModuleDefinitionData
}

@Suppress("FunctionName")
inline fun Module.ModuleDefinition(crossinline block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinitionData {
  return trace("${this.javaClass}.ModuleDefinition") { ModuleDefinitionBuilder(this).also(block).buildModule() }
}
