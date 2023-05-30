package devmenu.com.th3rdwave.safeareacontext

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.view.ViewTreeObserver
import com.facebook.infer.annotation.Assertions
import com.facebook.react.views.view.ReactViewGroup
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.viewevent.EventDispatcher

@SuppressLint("ViewConstructor")
class SafeAreaProvider @DoNotStrip constructor(context: Context) :
  ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener {
  private val onInsetsChange by EventDispatcher<InsetsChangeEvent>()

  init {
    setOnInsetsChangeListener(object : OnInsetsChangeListener {
      override fun onInsetsChange(view: SafeAreaProvider, insets: EdgeInsets, frame: Rect) {
        onInsetsChange(InsetsChangeEvent(
          insets,
          frame
        ))
      }
    })
  }

  interface OnInsetsChangeListener {
    fun onInsetsChange(view: SafeAreaProvider, insets: EdgeInsets, frame: Rect)
  }

  private var mInsetsChangeListener: OnInsetsChangeListener? = null
  private var mLastInsets: EdgeInsets? = null
  private var mLastFrame: Rect? = null

  private fun maybeUpdateInsets() {
    val edgeInsets = SafeAreaUtils.getSafeAreaInsets(this)
    val frame = SafeAreaUtils.getFrame(rootView as ViewGroup, this)
    if (edgeInsets != null && frame != null &&
      (mLastInsets == null || mLastFrame == null ||
        mLastInsets != edgeInsets ||
        mLastFrame != frame)) {
      Assertions.assertNotNull(mInsetsChangeListener).onInsetsChange(this, edgeInsets, frame)
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

  fun setOnInsetsChangeListener(listener: OnInsetsChangeListener?) {
    mInsetsChangeListener = listener
  }
}
