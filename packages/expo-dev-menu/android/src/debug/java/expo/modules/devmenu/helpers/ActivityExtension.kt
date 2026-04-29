package expo.modules.devmenu.helpers

import android.app.Activity
import android.content.Context
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.EditText

internal fun Activity.isAcceptingText(): Boolean {
  val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
  return imm?.isAcceptingText ?: false
}

/**
 * Returns true if the current focus is in an EditText (or descendant).
 * Used to avoid intercepting "r" key when typing in TextInput with hardware keyboard.
 * When using a hardware keyboard (Bluetooth, emulator, USB), isAcceptingText is false
 * even when focus is in a TextInput, so we need this additional check.
 */
internal fun Activity.isFocusInEditText(): Boolean {
  var view: View? = currentFocus ?: return false
  while (view != null) {
    if (view is EditText) return true
    view = view.parent as? View
  }
  return false
}
