package versioned.host.exp.exponent.modules.api.screens

import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext
import androidx.annotation.UiThread
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import kotlin.math.abs

abstract class FabricEnabledViewGroup constructor(context: ReactContext?) : ViewGroup(context) {
  protected fun updateScreenSizeFabric(width: Int, height: Int) {
    // do nothing
  }
}