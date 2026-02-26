package expo.modules.brownfield

object BrownfieldState {
  private var expoModule: ExpoBrownfieldStateModule? = null

  private val registry = mutableMapOf<String, SharedState>()
  private val subscriptions = mutableMapOf<String, MutableList<(Any?) -> Unit>>()
  private val deletedKeys = mutableSetOf<String>()

  fun getOrCreate(key: String): SharedState {
    synchronized(this) {
      return registry.getOrPut(key) { SharedState(key) }
    }
  }

  fun get(key: String): Any? {
    synchronized(this) {
      return registry[key]?.get()
    }
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
    synchronized(this) {
      deletedKeys.add(key)
      return registry.remove(key)?.get()
    }
  }

  fun maybeNotifyKeyRecreated(key: String) {
    synchronized(this) {
      if (!deletedKeys.contains(key)) {
        return
      }

      deletedKeys.remove(key)
    }
    expoModule?.notifyKeyRecreated(key)
  }

  internal fun setExpoModule(expoModule: ExpoBrownfieldStateModule?) {
    this.expoModule = expoModule
  }

  fun notifySubscribers(key: String, value: Any?) {
    val snapshot: List<(Any?) -> Unit>
    synchronized(this) {
      snapshot = subscriptions[key]?.toList() ?: emptyList()
    }
    snapshot.forEach { it(value) }
  }
}
