package expo.modules.kotlin.jni

import com.facebook.react.bridge.ReadableNativeMap

@Suppress("KotlinJniMissingFunction")
class JNIUtils {
  companion object {
    @JvmStatic
    external fun emitEvent(
      jsiThis: JavaScriptObject,
      jsiContext: JSIContext,
      eventName: String,
      eventBody: Array<Any?>
    )

    @JvmStatic
    external fun emitEvent(
      jsiThis: JavaScriptWeakObject,
      jsiContext: JSIContext,
      eventName: String,
      eventBody: Array<Any?>
    )

    @JvmStatic
    external fun emitEvent(
      jsiThis: JavaScriptModuleObject,
      jsiContext: JSIContext,
      eventName: String,
      eventBody: ReadableNativeMap?
    )
  }
}
