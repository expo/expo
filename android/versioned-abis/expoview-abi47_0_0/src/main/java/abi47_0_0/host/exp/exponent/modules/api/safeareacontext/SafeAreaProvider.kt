package abi47_0_0.host.exp.exponent.modules.api.safeareacontext

import android.content.Context
import android.view.ViewGroup
import android.view.ViewTreeObserver
import abi47_0_0.com.facebook.react.views.view.ReactViewGroup

typealias OnInsetsChangeHandler = (view: SafeAreaProvider, insets: EdgeInsets, frame: Rect) -> Unit

class SafeAreaProvider(context: Context?) :
  ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener {
  private var mInsetsChangeHandler: OnInsetsChangeHandler? = null
  private var mLastInsets: EdgeInsets? = null
  private var mLastFrame: Rect? = null

  private fun maybeUpdateInsets() {
    val insetsChangeHandler = mInsetsChangeHandler ?: return
    val edgeInsets = getSafeAreaInsets(this) ?: return
    val frame = getFrame(rootView as ViewGroup, this) ?: return
    if (mLastInsets != edgeInsets || mLastFrame != frame) {
      insetsChangeHandler(this, edgeInsets, frame)
      mLastInsets = edgeInsets
      mLastFrame = frame
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(this)
    maybeUpdateInsets()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    viewTreeObserver.removeOnPreDrawListener(this)
  }

  override fun onPreDraw(): Boolean {
    maybeUpdateInsets()
    return true
  }

  fun setOnInsetsChangeHandler(handler: OnInsetsChangeHandler?) {
    mInsetsChangeHandler = handler
    maybeUpdateInsets()
  }
}
