@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.objects

import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

class PropertyComponentBuilder(
  val name: String
) {
  var getter: SyncFunctionComponent? = null
  var setter: SyncFunctionComponent? = null

  /**
   * Modifier that sets property getter that has no arguments (the caller is not used).
   */
  inline fun <T> get(crossinline body: () -> T) = apply {
    getter = SyncFunctionComponent("get", arrayOf()) { body() }
  }

  /**
   * Modifier that sets property setter that receives only the new value as an argument.
   */
  inline fun <reified T> set(crossinline body: (newValue: T) -> Unit) = apply {
    setter = SyncFunctionComponent("set", arrayOf({ typeOf<T>() }.toAnyType<T>())) { body(it[0] as T) }
  }

  fun build(): PropertyComponent {
    return PropertyComponent(name, getter, setter)
  }
}
