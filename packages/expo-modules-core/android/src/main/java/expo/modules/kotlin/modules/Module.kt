package expo.modules.kotlin.modules

import android.os.Bundle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.providers.AppContextProvider
import expo.modules.kotlin.tracing.trace
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.CoroutineScope
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor

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

  private fun <T> convertEnumToString(enumValue: T): String where T : Enumerable, T : Enum<T> {
    val enumClass = enumValue::class
    val primaryConstructor = enumClass.primaryConstructor
    if (primaryConstructor?.parameters?.size == 1) {
      val parameterName = primaryConstructor.parameters.first().name
      val parameterProperty = enumClass
        .declaredMemberProperties
        .find { it.name == parameterName }

      requireNotNull(parameterProperty) { "Cannot find a property for $parameterName parameter" }
      require(parameterProperty.returnType.classifier == String::class) { "The enum parameter has to be a string." }

      @Suppress("UNCHECKED_CAST")
      return (parameterProperty as KProperty1<T, String>).get(enumValue)
    }

    return enumValue.name
  }
}

@Suppress("FunctionName")
inline fun Module.ModuleDefinition(crossinline block: ModuleDefinitionBuilder.() -> Unit): ModuleDefinitionData {
  return trace("${this.javaClass}.ModuleDefinition") { ModuleDefinitionBuilder(this).also(block).buildModule() }
}
