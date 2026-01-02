package expo.modules.kotlin.modules

import android.os.Bundle
import android.util.Log
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
    get() = requireNotNull(_appContextHolder.get()?.hostingRuntimeContext) { "The module wasn't created! You can't access the hosting runtime." }

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

  abstract fun definition(): ModuleDefinitionData

  /**
   * Internal method called during module registration to register optimized functions.
   * This method attempts to find a generated registry class for this module and
   * registers any @OptimizedFunction annotated functions using JNI reflection.
   *
   * NOTE: The generated registry no longer needs native libraries - it uses
   * JNI reflection with the shared C++ dispatcher in expo-modules-core!
   */
  internal fun registerOptimizedFunctions(decorator: expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject) {
    val registryClassName = "${this::class.java.name}_OptimizedRegistry"
    try {
      val registryClass = Class.forName(registryClassName)
      val registerMethod = registryClass.getDeclaredMethod(
        "registerOptimizedFunctions",
        expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject::class.java,
        this::class.java
      )
      registerMethod.invoke(null, decorator, this)
    } catch (e: ClassNotFoundException) {
      // No optimized functions for this module, continue normally
    } catch (e: Exception) {
      // Log error but don't fail module registration
      Log.w("Module", "Failed to register optimized functions for ${this::class.java.simpleName}: ${e.message}")
    }
  }
}

@Suppress("FunctionName")
inline fun Module.ModuleDefinition(crossinline block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinitionData {
  return trace("${this.javaClass}.ModuleDefinition") { ModuleDefinitionBuilder(this).also(block).buildModule() }
}

@Suppress("FunctionName")
inline fun Module.ModuleConverters(crossinline block: ModuleConvertersBuilder.() -> Unit): TypeConverterProvider {
  return trace("${this.javaClass}.TypeConverters") { ModuleConvertersBuilder().also(block).buildTypeConverterProvider() }
}
