package expo.modules.kotlin.types

import expo.modules.core.interfaces.DoNotStrip

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
  }
}
