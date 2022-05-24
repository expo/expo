package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

/**
 * A Kotlin representation of jsi::Object.
 * Should be used only on the runtime thread.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptObject @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) {

  external fun hasProperty(name: String): Boolean
  external fun getProperty(name: String): JavaScriptValue
  external fun getPropertyNames(): Array<String>

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }
}
