package expo.modules.video.delegates

import kotlin.reflect.KProperty

/**
 * Property delegate, where the set is ignored unless the value has changed.
 * @param T The type of the property.
 * @param value The initial value of the property.
 * @param propertyMapper A function that maps the new value to the property value.
 * @param didSet A function that is called when the property value has changed.
*/

class IgnoreSameSet<T : Any?>(private var value: T, val propertyMapper: ((T) -> T) = { v -> v }, val didSet: ((new: T, old: T) -> Unit)? = null) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): T {
    return value
  }

  operator fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
    if (this.value?.equals(propertyMapper(value)) ?: false) return
    val oldValue = this.value
    this.value = propertyMapper(value)
    didSet?.invoke(this.value, oldValue)
  }
}
