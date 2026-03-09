package expo.modules.brownfield

import expo.modules.kotlin.sharedobjects.SharedObject

class SharedState(val key: String) : SharedObject() {
  private var value: Any? = null

  fun get(): Any? {
    synchronized(this) {
      return value
    }
  }

  fun set(newValue: Any?) {
    synchronized(this) {
      value = newValue
    }
    emit("change", mapOf("value" to newValue))
    BrownfieldState.notifySubscribers(key, newValue)
    BrownfieldState.maybeNotifyKeyRecreated(key)
  }
}
