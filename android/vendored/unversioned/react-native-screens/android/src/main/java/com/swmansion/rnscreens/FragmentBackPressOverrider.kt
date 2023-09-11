package com.swmansion.rnscreens

import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment

class FragmentBackPressOverrider(
    private val fragment: Fragment,
    private val mOnBackPressedCallback: OnBackPressedCallback
) {
    private var mIsBackCallbackAdded: Boolean = false
    var overrideBackAction: Boolean = true

    fun maybeAddBackCallback() {
        if (!mIsBackCallbackAdded && overrideBackAction) {
            fragment.activity?.onBackPressedDispatcher?.addCallback(
                fragment,
                mOnBackPressedCallback
            )
            mIsBackCallbackAdded = true
        }
    }

    fun removeBackCallbackIfAdded() {
        if (mIsBackCallbackAdded) {
            mOnBackPressedCallback.remove()
            mIsBackCallbackAdded = false
        }
    }
}
