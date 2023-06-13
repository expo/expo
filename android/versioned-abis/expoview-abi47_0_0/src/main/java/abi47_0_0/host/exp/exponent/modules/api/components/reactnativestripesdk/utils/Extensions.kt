package abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils

import android.content.Context
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext

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
  (context.currentActivity as? AppCompatActivity)?.supportFragmentManager?.let {
    if (it.findFragmentByTag(this.tag) != null) {
      it.beginTransaction().remove(this).commitAllowingStateLoss()
    }
  }
}
