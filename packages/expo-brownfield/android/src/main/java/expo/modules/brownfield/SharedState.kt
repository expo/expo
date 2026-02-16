package expo.modules.brownfield

import expo.modules.kotlin.sharedobjects.SharedObject

fun interface Removable {
  fun remove()
}

class SharedState: SharedObject() {
  private var value: Any? = null
  private val listeners = mutableListOf<(Any?) -> Unit>()

  fun get(): Any? {
    return value
  }

  fun set(newValue: Any?) {
    value = newValue
    emit("change", mapOf("value" to newValue))
    listeners.forEach { it(newValue) }
  }

  fun addListener(listener: ((Any?) -> Unit)): Removable {
    listeners.add(listener)
    return Removable {
      listeners.remove(listener)
    }
  }
}
