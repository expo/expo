package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip

/**
 * A Kotlin representation of jsi::Value.
 * Should be used only on the runtime thread.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptValue @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) {
  external fun kind(): String

  external fun isNull(): Boolean
  external fun isUndefined(): Boolean
  external fun isBool(): Boolean
  external fun isNumber(): Boolean
  external fun isString(): Boolean
  external fun isSymbol(): Boolean
  external fun isFunction(): Boolean
  external fun isArray(): Boolean
  external fun isTypedArray(): Boolean
  external fun isObject(): Boolean

  external fun getBool(): Boolean
  external fun getDouble(): Double
  external fun getString(): String
  external fun getObject(): JavaScriptObject
  external fun getArray(): Array<JavaScriptValue>
  external fun getTypedArray(): JavaScriptTypedArray

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }
}
