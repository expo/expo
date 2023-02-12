package abi46_0_0.host.exp.exponent.modules.api.screens

import android.view.ViewGroup
import abi46_0_0.com.facebook.react.bridge.ReactContext

abstract class FabricEnabledViewGroup constructor(context: ReactContext?) : ViewGroup(context) {
  protected fun updateScreenSizeFabric(width: Int, height: Int) {
    // do nothing
  }
}
