// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.views

import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.view.MotionEvent
import androidx.appcompat.widget.AppCompatImageButton

class ExponentImageButton : AppCompatImageButton {
  constructor(context: Context) : super(context) {
    init()
  }

  constructor(context: Context, attrs: AttributeSet?) : super(context, attrs) {
    init()
  }

  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(
    context,
    attrs,
    defStyleAttr
  ) {
    init()
  }

  private fun init() {
    setOnTouchListener { v, event ->
      if (event.action == MotionEvent.ACTION_UP) {
        setColorFilter(Color.TRANSPARENT)
      } else if (event.action == MotionEvent.ACTION_DOWN) {
        setColorFilter(Color.GRAY)
      }
      v.performClick()
    }
  }
}
