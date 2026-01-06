package expo.modules.kotlin.views

import com.facebook.react.bridge.Arguments
import java.lang.ref.WeakReference

class ShadowNodeProxy(expoView: ExpoView) {
  val weakExpoView = WeakReference(expoView)

  fun setViewSize(width: Double, height: Double) {
    weakExpoView.get()?.stateWrapper?.updateState(Arguments.makeNativeMap(mapOf("width" to width, "height" to height)))
  }

  fun setStyleSize(width: Double?, height: Double?) {
    weakExpoView.get()?.stateWrapper?.updateState(
      Arguments.makeNativeMap(
        mapOf(
          "styleWidth" to width,
          "styleHeight" to height
        )
      )
    )
  }
}
