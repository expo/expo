package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.types.JSTypeConverterProvider

/**
 * A JavaScript function passed to a native function. Call it any number of times from any thread.
 * Every call runs on the JS thread; calls made after the runtime is gone are dropped.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class Callback @DoNotStrip internal constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  operator fun invoke(vararg args: Any?) = checkIfValid {
    val converted = Array(args.size) { index ->
      JSTypeConverterProvider.convertToJSValue(args[index], useExperimentalConverter = true)
    }
    invokeNative(converted)
  }

  private external fun invokeNative(args: Array<Any?>)

  private inline fun checkIfValid(body: () -> Unit) {
    try {
      body()
    } catch (e: Throwable) {
      if (!mHybridData.isValid) {
        // A multi-fire callback is allowed to outlive its runtime, unlike JavaCallback, so a call
        // after teardown is dropped silently.
        return
      }
      throw e
    }
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }
}
