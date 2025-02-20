package expo.modules.kotlin.views

import com.facebook.react.bridge.Arguments

class ShadowNodeProxy(val expoView: ExpoView) {
  fun setViewSize(width: Double, height: Double) {
    expoView.stateWrapper?.updateState(Arguments.makeNativeMap(mapOf("width" to width, "height" to height)))
  }
}
