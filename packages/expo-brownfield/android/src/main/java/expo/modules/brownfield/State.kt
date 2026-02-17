package expo.modules.brownfield

object BrownfieldState {
  private val registry = mutableMapOf<String, SharedState>()

  fun getOrCreate(key: String): SharedState {
    return registry.getOrPut(key) { SharedState() }
  }

  fun get(key: String): Any? {
    return registry[key]?.get()
  }

  fun set(key: String, value: Any?) {
    val state = registry.getOrPut(key) { SharedState() }
    state.set(value)
  }

  fun subscribe(key: String, callback: (Any?) -> Unit): Removable {
    val state = registry.getOrPut(key) { SharedState() }
    return state.addListener(callback)
  }

  fun delete(key: String): Any? {
    val state = registry.remove(key)
    return state?.get()
  }
}
