package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

/**
 * A Kotlin representation to a jsi::WeakObject
 * Should be used only on the runtime thread.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptWeakObject @DoNotStrip internal constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }
  external fun lock(): JavaScriptObject
}
