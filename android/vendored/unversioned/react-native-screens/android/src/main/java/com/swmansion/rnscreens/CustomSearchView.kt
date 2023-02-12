package com.swmansion.rnscreens

import android.content.Context
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.widget.SearchView
import androidx.fragment.app.Fragment

class CustomSearchView(context: Context, fragment: Fragment) : SearchView(context) {
    /*
        CustomSearchView uses some variables from SearchView. They are listed below with links to documentation
        isIconified - https://developer.android.com/reference/android/widget/SearchView#setIconified(boolean)
        maxWidth - https://developer.android.com/reference/android/widget/SearchView#setMaxWidth(int)
        setOnSearchClickListener - https://developer.android.com/reference/android/widget/SearchView#setOnSearchClickListener(android.view.View.OnClickListener)
        setOnCloseListener - https://developer.android.com/reference/android/widget/SearchView#setOnCloseListener(android.widget.SearchView.OnCloseListener)
    */
    private var mCustomOnCloseListener: OnCloseListener? = null
    private var mCustomOnSearchClickedListener: OnClickListener? = null

    private var mOnBackPressedCallback: OnBackPressedCallback =
        object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                isIconified = true
            }
        }

    private val backPressOverrider = FragmentBackPressOverrider(fragment, mOnBackPressedCallback)

    var overrideBackAction: Boolean
        set(value) {
            backPressOverrider.overrideBackAction = value
        }
        get() = backPressOverrider.overrideBackAction

    fun focus() {
        isIconified = false
        requestFocusFromTouch()
    }

    override fun setOnCloseListener(listener: OnCloseListener?) {
        mCustomOnCloseListener = listener
    }

    override fun setOnSearchClickListener(listener: OnClickListener?) {
        mCustomOnSearchClickedListener = listener
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (!isIconified) {
            backPressOverrider.maybeAddBackCallback()
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        backPressOverrider.removeBackCallbackIfAdded()
    }

    init {
        super.setOnSearchClickListener { v ->
            mCustomOnSearchClickedListener?.onClick(v)
            backPressOverrider.maybeAddBackCallback()
        }

        super.setOnCloseListener {
            val result = mCustomOnCloseListener?.onClose() ?: false
            backPressOverrider.removeBackCallbackIfAdded()
            result
        }

        maxWidth = Integer.MAX_VALUE
    }
}
