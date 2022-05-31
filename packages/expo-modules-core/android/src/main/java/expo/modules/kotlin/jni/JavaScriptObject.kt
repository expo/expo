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

  private external fun setBoolProperty(name: String, value: Boolean)
  private external fun setDoubleProperty(name: String, value: Double)
  private external fun setStringProperty(name: String, value: String?)
  private external fun setJSValueProperty(name: String, value: JavaScriptValue?)
  private external fun setJSObjectProperty(name: String, value: JavaScriptObject?)
  private external fun unsetProperty(name: String)

  fun setProperty(name: String, value: Boolean) = setBoolProperty(name, value)
  fun setProperty(name: String, value: Int) = setDoubleProperty(name, value.toDouble())
  fun setProperty(name: String, value: Double) = setDoubleProperty(name, value)
  fun setProperty(name: String, value: String?) = setStringProperty(name, value)
  fun setProperty(name: String, value: JavaScriptValue?) = setJSValueProperty(name, value)
  fun setProperty(name: String, value: JavaScriptObject?) = setJSObjectProperty(name, value)

  // Needed to handle untyped null value
  // Without it setProperty(name, null) won't work
  fun setProperty(name: String, `null`: Nothing?) = unsetProperty(name)

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }
}
