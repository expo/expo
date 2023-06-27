package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils

import android.content.Context
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi49_0_0.com.facebook.react.bridge.ReadableMap

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

fun Fragment.removeFragment(context: ReactApplicationContext) {
  (context.currentActivity as? FragmentActivity)?.supportFragmentManager?.let {
    if (it.findFragmentByTag(this.tag) != null) {
      it.beginTransaction().remove(this).commitAllowingStateLoss()
    }
  }
}

fun ReadableMap.getBooleanOr(key: String, default: Boolean): Boolean {
  return if (this.hasKey(key)) this.getBoolean(key) else default
}
