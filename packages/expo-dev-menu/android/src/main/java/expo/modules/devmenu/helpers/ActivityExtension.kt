package expo.modules.devmenu.helpers

import android.app.Activity
import android.content.Context
import android.view.inputmethod.InputMethodManager

internal fun Activity.isAcceptingText(): Boolean {
  val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
  return imm?.isAcceptingText ?: false
}
