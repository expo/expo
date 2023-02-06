package abi48_0_0.com.swmansion.rnscreens

import android.view.ViewGroup
import abi48_0_0.com.facebook.react.bridge.ReactContext

abstract class FabricEnabledViewGroup constructor(context: ReactContext?) : ViewGroup(context) {
    protected fun updateScreenSizeFabric(width: Int, height: Int) {
        // do nothing
    }
}
