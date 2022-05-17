package expo.modules.kotlin.modules

import android.content.Context
import android.os.Bundle
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.kotlin.providers.ContextProvider
import expo.modules.kotlin.providers.CoroutineScopeProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.cancel
import java.lang.IllegalStateException

abstract class Module: AppContextProvider, ContextProvider, CoroutineScopeProvider {

// region AppContextProvider

  @Suppress("PropertyName")
  internal var _appContext: AppContext? = null

  override val appContext: AppContext
    get() = requireNotNull(_appContext) { "The module wasn't created! You can't access the app context." }

// endregion

// region ContextProvider

  override val context: Context
    get() = requireNotNull(appContext.reactContext) { "React Application Context is null. You can't access the context at this point." }

// endregion

// region CoroutineScopeProvider

  @Suppress("PropertyName")
  @PublishedApi
  internal lateinit var coroutineScopeDelegate: Lazy<CoroutineScope>

  override val coroutineScope: CoroutineScope
    get() = coroutineScopeDelegate.value

// endregion

  private val moduleEventEmitter by lazy { appContext.eventEmitter(this) }

  fun sendEvent(name: String, body: Bundle?) {
    moduleEventEmitter?.emit(name, body)
  }

  abstract fun definition(): ModuleDefinitionData

  internal fun cleanUp() {
    if (coroutineScopeDelegate.isInitialized()) {
      try {
        coroutineScope.cancel(ModuleDestroyedException())
      } catch (cause: IllegalStateException) {
        // cancelling coroutine without an active job would cause IllegalStateException
      }
    }
  }
}

@Suppress("FunctionName")
inline fun Module.ModuleDefinition(block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinitionData {
  return ModuleDefinitionBuilder(this).also(block).build()
}
