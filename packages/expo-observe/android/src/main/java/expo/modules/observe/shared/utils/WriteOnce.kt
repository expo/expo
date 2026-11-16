package expo.modules.observe.shared.utils

/** A value that can be set once. Reads before the set return the initial value and do not block the set. */
internal class WriteOnce<T>(initialValue: T) {
  private var current = initialValue
  var isSet = false
    @Synchronized get
    private set

  val value: T
    @Synchronized get() = current

  /** Returns `false`, and keeps the current value, when the value was already set. */
  @Synchronized
  fun set(value: T): Boolean {
    if (isSet) {
      return false
    }
    current = value
    isSet = true
    return true
  }
}
