package com.swmansion.rnscreens

import android.view.View
import androidx.fragment.app.Fragment
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver

class LifecycleHelper {
    private val mViewToLifecycleMap: MutableMap<View, Lifecycle> = HashMap()
    private val mRegisterOnLayoutChange: View.OnLayoutChangeListener = object : View.OnLayoutChangeListener {
        override fun onLayoutChange(
            view: View,
            i: Int,
            i1: Int,
            i2: Int,
            i3: Int,
            i4: Int,
            i5: Int,
            i6: Int,
            i7: Int
        ) {
            registerViewWithLifecycleOwner(view)
            view.removeOnLayoutChangeListener(this)
        }
    }

    private fun registerViewWithLifecycleOwner(view: View) {
        val parent = findNearestScreenFragmentAncestor(view)
        if (parent != null && view is LifecycleObserver) {
            val lifecycle = parent.lifecycle
            lifecycle.addObserver((view as LifecycleObserver))
            mViewToLifecycleMap[view] = lifecycle
        }
    }

    fun <T> register(view: T) where T : View, T : LifecycleObserver? {
        // we need to wait until view is mounted in the hierarchy as this method is called only at the
        // moment of the view creation. In order to register lifecycle observer we need to find ancestor
        // of type Screen and this can only happen when the view is properly attached. We rely on
        // Android's onLayout callback being triggered when the view gets added to the hierarchy and
        // only then we attempt to locate lifecycle owner ancestor.
        view.addOnLayoutChangeListener(mRegisterOnLayoutChange)
    }

    fun <T> unregister(view: T) where T : View, T : LifecycleObserver? {
        mViewToLifecycleMap[view]?.removeObserver(view)
    }

    companion object {
        fun findNearestScreenFragmentAncestor(view: View): Fragment? {
            var parent = view.parent
            while (parent != null && parent !is Screen) {
                parent = parent.parent
            }
            return if (parent != null) {
                (parent as Screen).fragment
            } else null
        }
    }
}
