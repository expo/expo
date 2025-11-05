package expo.modules.kotlin.types

import expo.modules.core.interfaces.DoNotStrip
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.InvocationKind
import kotlin.contracts.contract

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

@OptIn(ExperimentalContracts::class)
inline fun <T, reified R> ValueOrUndefined<T>.map(transform: (T) -> R): ValueOrUndefined<R> {
  contract {
    callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
  }
  return when (this) {
    is ValueOrUndefined.Value -> ValueOrUndefined.Value(transform(value))
    is ValueOrUndefined.Undefined -> ValueOrUndefined.getUndefined<R>()
  }
}
