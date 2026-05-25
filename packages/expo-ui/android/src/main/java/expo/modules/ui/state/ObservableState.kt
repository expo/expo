package expo.modules.ui.state

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.sharedobjects.SharedObject

/**
 * Created from JavaScript via `useNativeState(initialValue)`.
 * When a composable reads `value`, Compose tracks the read and
 * recomposes automatically when the value changes.
 */
class ObservableState(initialValue: Any? = null) : SharedObject() {
  private val _state: MutableState<Any?> = mutableStateOf(initialValue)
  internal var onChange: WorkletCallback? = null
  private var isNotifying = false

  var value: Any?
    get() = _state.value
    set(v) {
      _state.value = v
      // Skip re-invoking onChange if state.value was written from inside onChange.
      if (isNotifying) return
      isNotifying = true
      try {
        onChange?.invoke(v)
      } finally {
        isNotifying = false
      }
    }

  @Suppress("UNCHECKED_CAST")
  fun <T> binding(fallback: T): T {
    return (_state.value as? T) ?: fallback
  }
}
