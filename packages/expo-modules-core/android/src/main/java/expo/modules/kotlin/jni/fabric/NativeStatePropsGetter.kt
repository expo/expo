package expo.modules.kotlin.jni.fabric

import com.facebook.yoga.annotations.DoNotStrip

@DoNotStrip
class NativeStatePropsGetter {
  // We can't use StateWrapper directly, as this class is not exposed
  external fun getStateProps(stateWrapper: Any): Map<String, Any?>?
}
