package expo.modules.kotlin.jni.fabric

import com.facebook.jni.HybridData
import com.facebook.yoga.annotations.DoNotStrip

@DoNotStrip
class NativeStatePropsGetter {
  // We can't use StateWrapper directly, as this class is not exposed
  external fun getStateProps(stateWrapper: Any): Map<String, Any?>?

  // Synchronously flush a style property size update in the current frame (pass NaN for "unset").
  fun updateStyleSizeImmediate(stateWrapper: Any, styleWidth: Double, styleHeight: Double) {
    if (!isStateValid(stateWrapper)) {
      return
    }
    updateStyleSizeImmediateImpl(stateWrapper, styleWidth, styleHeight)
  }

  // Synchronously flush a size update in the current frame.
  fun updateViewSizeImmediate(stateWrapper: Any, width: Double, height: Double) {
    if (!isStateValid(stateWrapper)) {
      return
    }
    updateViewSizeImmediateImpl(stateWrapper, width, height)
  }

  private external fun updateStyleSizeImmediateImpl(
    stateWrapper: Any,
    styleWidth: Double,
    styleHeight: Double
  )

  private external fun updateViewSizeImmediateImpl(stateWrapper: Any, width: Double, height: Double)

  // The only `StateWrapper` is RN's `StateWrapperImpl`, a fbjni `HybridData`. When the shadow node is
  // destroyed its native pointer is reset and calling into it throws. Skip the update like RN does
  // before its own native state accesses.
  private fun isStateValid(stateWrapper: Any): Boolean = (stateWrapper as? HybridData)?.isValid == true
}
