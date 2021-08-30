package expo.modules.devmenu

import java.util.*
import kotlin.properties.ReadOnlyProperty
import kotlin.reflect.KProperty

class KeyValueCachedPropertyProxy<TKey, TValue>(
  private var loader: (TKey) -> TValue,
  private val container: WeakHashMap<TKey, TValue>
) {

  operator fun get(key: TKey): TValue {
    if (!container.containsKey(key)) {
      container[key] = loader(key)
    }

    return container[key]!!
  }
}

class KeyValueCachedProperty<TKey, TValue>(private val loader: (TKey) -> TValue) : ReadOnlyProperty<Any, KeyValueCachedPropertyProxy<TKey, TValue>> {
  private val container = WeakHashMap<TKey, TValue>()

  override fun getValue(thisRef: Any, property: KProperty<*>): KeyValueCachedPropertyProxy<TKey, TValue> {
    return KeyValueCachedPropertyProxy(loader, container)
  }
}
