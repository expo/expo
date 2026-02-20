package expo.modules.brownfield

fun interface Removable {
  fun remove()
}

object BrownfieldState {
  private val registry = mutableMapOf<String, SharedState>()
  private val subscriptions = mutableMapOf<String, MutableList<(Any?) -> Unit>>()
  private val notifyingKeys = mutableSetOf<String>()

  fun getOrCreate(key: String): SharedState {
    synchronized(this) {
      return registry.getOrPut(key) { SharedState(key) }
    }
  }

  fun get(key: String): Any? {
    val state: SharedState?
    synchronized(this) {
      state = registry[key]
    }
    return state?.get()
  }

  fun set(key: String, value: Any?) {
    val state: SharedState
    synchronized(this) {
      state = registry.getOrPut(key) { SharedState(key) }
    }
    state.set(value)
  }

  fun subscribe(key: String, callback: (Any?) -> Unit): Removable {
    synchronized(this) {
      subscriptions.getOrPut(key) { mutableListOf() }.add(callback)
    }
    return Removable {
      synchronized(this@BrownfieldState) {
        subscriptions[key]?.remove(callback)
      }
    }
  }

  fun delete(key: String): Any? {
    val state: SharedState?
    synchronized(this) {
      state = registry.remove(key)
    }
    return state?.get()
  }

  fun notifySubscribers(key: String, value: Any?) {
    synchronized(this) {
      if (!notifyingKeys.add(key)) return
    }

    try {
      val snapshot: List<(Any?) -> Unit>
      synchronized(this) {
        snapshot = subscriptions[key]?.toList() ?: emptyList()
      }
      snapshot.forEach { it(value) }
    } finally {
      synchronized(this) {
        notifyingKeys.remove(key)
      }
    }
  }
}
