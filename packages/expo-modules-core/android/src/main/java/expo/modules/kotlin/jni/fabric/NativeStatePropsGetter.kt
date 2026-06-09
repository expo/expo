package expo.modules.kotlin.jni.fabric

import com.facebook.yoga.annotations.DoNotStrip

@DoNotStrip
class NativeStatePropsGetter {
  // We can't use StateWrapper directly, as this class is not exposed
  external fun getStateProps(stateWrapper: Any): Map<String, Any?>?

  // Synchronously flush a style property size update in the current frame (pass NaN for "unset").
  external fun updateStyleSizeImmediate(stateWrapper: Any, styleWidth: Double, styleHeight: Double)

  // Synchronously flush a size update in the current frame.
  external fun updateViewSizeImmediate(stateWrapper: Any, width: Double, height: Double)
}
