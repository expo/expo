package com.swmansion.rnscreens

import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.FabricViewStateManager

abstract class FabricEnabledViewGroup constructor(context: ReactContext?) : ViewGroup(context) {

    val fabricViewStateManager get() = null as FabricViewStateManager?

    protected fun updateScreenSizeFabric(width: Int, height: Int) {
        // do nothing
    }
}
