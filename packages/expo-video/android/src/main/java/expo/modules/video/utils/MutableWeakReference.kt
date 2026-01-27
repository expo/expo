package expo.modules.video.utils

import java.lang.ref.WeakReference
import kotlin.reflect.KProperty

internal class MutableWeakReference<T : Any?>(initialValue: T, val didSet: ((new: T?, old: T?) -> Unit)? = null) {
  private var ref: WeakReference<T> = WeakReference(initialValue)

  operator fun getValue(thisRef: Any?, property: KProperty<*>): T? {
    return get()
  }

  operator fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
    set(value)
  }

  fun get(): T? {
    return ref.get()
  }

  fun set(value: T) {
    val oldValue = ref.get()
    ref = WeakReference(value)
    didSet?.invoke(oldValue, value)
  }
}
