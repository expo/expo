package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.Context
import android.view.View
import android.view.inputmethod.InputMethodManager

fun View.showSoftKeyboard() {
  post {
    if (this.requestFocus()) {
      val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager?
      imm?.showSoftInput(this, InputMethodManager.SHOW_IMPLICIT)
    }
  }
}

fun View.hideSoftKeyboard() {
  if (this.requestFocus()) {
    val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager?
    imm?.hideSoftInputFromWindow(windowToken, 0)
  }
}
