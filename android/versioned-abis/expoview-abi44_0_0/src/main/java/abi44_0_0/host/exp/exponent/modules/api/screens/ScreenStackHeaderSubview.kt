package abi44_0_0.host.exp.exponent.modules.api.screens

import android.annotation.SuppressLint
import android.view.View
import abi44_0_0.com.facebook.react.bridge.ReactContext
import abi44_0_0.com.facebook.react.views.view.ReactViewGroup

@SuppressLint("ViewConstructor")
class ScreenStackHeaderSubview(context: ReactContext?) : ReactViewGroup(context) {
  private var mReactWidth = 0
  private var mReactHeight = 0
  var type = Type.RIGHT
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (MeasureSpec.getMode(widthMeasureSpec) == MeasureSpec.EXACTLY &&
      MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY
    ) {
      // dimensions provided by react
      mReactWidth = MeasureSpec.getSize(widthMeasureSpec)
      mReactHeight = MeasureSpec.getSize(heightMeasureSpec)
      val parent = parent
      if (parent != null) {
        forceLayout()
        (parent as View).requestLayout()
      }
    }
    setMeasuredDimension(mReactWidth, mReactHeight)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // no-op
  }

  enum class Type {
    LEFT, CENTER, RIGHT, BACK
  }
}
