package expo.modules.kotlin.objects

import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.KType

open class PropertyComponentBuilder(
  val name: String
) {
  var getter: SyncFunctionComponent? = null
  var setter: SyncFunctionComponent? = null

  /**
   * Modifier that sets property getter that has no arguments (the caller is not used).
   */
  inline fun <T> get(crossinline body: () -> T) = apply {
    getter = SyncFunctionComponent("get", emptyArray()) { body() }
  }

  /**
   * Modifier that sets property setter that receives only the new value as an argument.
   */
  inline fun <reified T> set(crossinline body: (newValue: T) -> Unit) = apply {
    setter = SyncFunctionComponent("set", arrayOf(toAnyType<T>())) { body(it[0] as T) }
  }

  fun build(): PropertyComponent {
    return PropertyComponent(name, getter, setter)
  }
}

class PropertyComponentBuilderWithThis<ThisType>(
  val thisType: KType,
  name: String
) : PropertyComponentBuilder(name) {

  /**
   * Modifier that sets property getter that has caller.
   */
  inline fun <T> get(crossinline body: (ThisType) -> T) = apply {
    getter = SyncFunctionComponent("get", arrayOf(AnyType(thisType))) {
      @Suppress("UNCHECKED_CAST")
      body(it[0] as ThisType)
    }.also {
      it.ownerType = thisType
      it.canTakeOwner = true
    }
  }

  /**
   * Modifier that sets property setter that receives only the new value as an argument.
   */
  inline fun <reified T> set(crossinline body: (self: ThisType, newValue: T) -> Unit) = apply {
    setter = SyncFunctionComponent("set", arrayOf(AnyType(thisType), toAnyType<T>())) {
      @Suppress("UNCHECKED_CAST")
      body(it[0] as ThisType, it[1] as T)
    }.also {
      it.ownerType = thisType
      it.canTakeOwner = true
    }
  }
}
