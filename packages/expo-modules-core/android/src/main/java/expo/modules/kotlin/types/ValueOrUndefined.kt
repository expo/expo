package expo.modules.kotlin.types

import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.types.ValueOrUndefined.Companion.getUndefined

@DoNotStrip
sealed interface ValueOrUndefined<T> {
  val isUndefined: Boolean
    get() = this is Undefined

  val optional: T?
    get() = when (this) {
      is Value -> value
      is Undefined -> null
    }

  data class Value<T>(val value: T) : ValueOrUndefined<T>
  object Undefined : ValueOrUndefined<Nothing>

  companion object {
    // helper function that can be used from C++ to get the instance of Undefined
    @JvmStatic
    @DoNotStrip
    fun getUndefined(): Any = Undefined

    @Suppress("UNCHECKED_CAST")
    inline fun <reified T> getUndefined() = Undefined as ValueOrUndefined<T>

    @Suppress("FunctionName")
    inline fun <reified T> Undefined(): ValueOrUndefined<T> = getUndefined<T>()
  }
}

inline fun <T, reified R> ValueOrUndefined<T>.flatMap(transform: (T) -> ValueOrUndefined<R>): ValueOrUndefined<R> =
  when (this) {
    is ValueOrUndefined.Value -> transform(value)
    is ValueOrUndefined.Undefined -> getUndefined<R>()
  }

