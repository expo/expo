package com.swmansion.rnscreens

import android.annotation.SuppressLint
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.views.view.ReactViewGroup

@SuppressLint("ViewConstructor")
class ScreenStackHeaderSubview(context: ReactContext?) : ReactViewGroup(context) {
    private var mReactWidth = 0
    private var mReactHeight = 0
    var type = Type.RIGHT

    val config: ScreenStackHeaderConfig?
        get() = (parent as? CustomToolbar)?.config

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

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit

    enum class Type {
        LEFT, CENTER, RIGHT, BACK, SEARCH_BAR
    }
}
