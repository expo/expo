package com.swmansion.rnscreens

import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext

abstract class FabricEnabledViewGroup constructor(context: ReactContext?) : ViewGroup(context) {
    protected fun updateScreenSizeFabric(width: Int, height: Int) {
        // do nothing
    }
}
