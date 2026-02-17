package expo.modules.brownfield

import expo.modules.kotlin.sharedobjects.SharedObject

fun interface Removable {
  fun remove()
}

class SharedState : SharedObject() {
  private var value: Any? = null
  private val listeners = mutableListOf<(Any?) -> Unit>()

  fun get(): Any? {
    synchronized(this) {
      return value
    }
  }

  fun set(newValue: Any?) {
    val listenersSnapshot: List<(Any?) -> Unit>
    synchronized(this) {
      value = newValue
      listenersSnapshot = listeners.toList()
    }
    emit("change", mapOf("value" to newValue))
    listenersSnapshot.forEach { it(newValue) }
  }

  fun addListener(listener: ((Any?) -> Unit)): Removable {
    synchronized(this) {
      listeners.add(listener)
    }
    return Removable {
      synchronized(this) {
        listeners.remove(listener)
      }
    }
  }
}
