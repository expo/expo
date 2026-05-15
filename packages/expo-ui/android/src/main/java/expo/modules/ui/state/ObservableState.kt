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

  var value: Any?
    get() = _state.value
    set(v) {
      _state.value = v
    }

  @Suppress("UNCHECKED_CAST")
  fun <T> binding(fallback: T): T {
    return (_state.value as? T) ?: fallback
  }
}
