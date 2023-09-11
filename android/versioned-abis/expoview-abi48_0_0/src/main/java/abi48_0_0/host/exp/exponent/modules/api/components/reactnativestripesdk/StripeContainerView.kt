package abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.Context
import android.graphics.Rect
import android.view.MotionEvent
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.FrameLayout
import abi48_0_0.com.facebook.react.uimanager.ThemedReactContext

class StripeContainerView(private val context: ThemedReactContext) : FrameLayout(context) {
  private var keyboardShouldPersistTapsValue: Boolean = true

  init {
    rootView.isFocusable = true
    rootView.isFocusableInTouchMode = true
    rootView.isClickable = true
  }

  fun setKeyboardShouldPersistTaps(value: Boolean) {
    keyboardShouldPersistTapsValue = value
  }

  override fun dispatchTouchEvent(event: MotionEvent?): Boolean {
    if (event!!.action == MotionEvent.ACTION_DOWN && !keyboardShouldPersistTapsValue) {
      val v = context.currentActivity!!.currentFocus
      if (v is EditText) {
        val outRect = Rect()
        v.getGlobalVisibleRect(outRect)
        if (!outRect.contains(event.rawX.toInt(), event.rawY.toInt())) {
          val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
          imm.hideSoftInputFromWindow(v.windowToken, 0)
          rootView.requestFocus()
        }
      }
    }
    return super.dispatchTouchEvent(event)
  }
}
