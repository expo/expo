package expo.modules.kotlin.modules

import android.app.Activity
import android.os.Bundle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.convertToString
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.TypeConverterProvider
import kotlinx.coroutines.CoroutineScope
import java.lang.ref.WeakReference

abstract class Module : AppContextProvider {
  @Suppress("PropertyName")
  internal var _appContextHolder: WeakReference<AppContext> = WeakReference(null)

  val runtime: Runtime
    get() = requireNotNull(_appContextHolder.get()?.runtime) { "The module wasn't created! You can't access the hosting runtime." }

  @Deprecated(
    message = "Use 'runtime' property instead.",
    replaceWith = ReplaceWith("runtime")
  )
  val runtimeContext: Runtime
    get() = runtime

  // region AppContextProvider

  override val appContext: AppContext
    get() = requireNotNull(_appContextHolder.get()) {
      "You attempted to access the app context before the module was created. " +
        "Defer accessing the context until after the module initializes."
    }

  // endregion

  private val moduleEventEmitter by lazy { appContext.eventEmitter(this) }

  val registry
    get() = appContext.registry

  @PublishedApi
  internal lateinit var coroutineScopeDelegate: Lazy<CoroutineScope>

  fun sendEvent(name: String, body: Bundle? = Bundle.EMPTY) {
    moduleEventEmitter?.emit(name, body)
  }

  fun sendEvent(name: String, body: Map<String, Any?>) {
    moduleEventEmitter?.emit(name, body)
  }

  fun <T> sendEvent(enum: T, body: Bundle? = Bundle.EMPTY) where T : Enumerable, T : Enum<T> {
    moduleEventEmitter?.emit(enum.convertToString(), body)
  }

  fun <T> sendEvent(enum: T, body: Map<String, Any?>? = null) where T : Enumerable, T : Enum<T> {
    moduleEventEmitter?.emit(enum.convertToString(), body)
  }

  open fun converters(): TypeConverterProvider? = null

  /**
   * Returns the current Activity as [T], for example `FragmentActivity`.
   * Throws an actionable [expo.modules.kotlin.exception.Exceptions.UnsupportedHostActivity] that names this module
   * when the Activity does not extend [T].
   * Pair it with `RequiresHostActivity<T>()` in the definition, so the host learns about the need early.
   */
  inline fun <reified T : Activity> requireHostActivity(): T {
    val holder = appContext.registry.getModuleHolder(this)
    val requirement = holder?.definition?.hostActivityRequirement?.takeIf { it.activityClass == T::class.java }
    return appContext.requireHostActivity("The ${holder?.name ?: javaClass.simpleName} module", requirement?.feature)
  }

  abstract fun definition(): ModuleDefinitionData
}

@Suppress("FunctionName")
inline fun Module.ModuleDefinition(crossinline block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinitionData {
  return trace("${this.javaClass}.ModuleDefinition") { ModuleDefinitionBuilder(this).also(block).buildModule() }
}

@Suppress("FunctionName")
inline fun Module.ModuleConverters(crossinline block: ModuleConvertersBuilder.() -> Unit): TypeConverterProvider {
  return trace("${this.javaClass}.TypeConverters") { ModuleConvertersBuilder().also(block).buildTypeConverterProvider() }
}
