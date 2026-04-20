package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.logger
import expo.modules.kotlin.types.JSTypeConverterProvider

/**
 * A multi-fire async callback that invokes a JavaScript function from native.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JSCallback @DoNotStrip internal constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {

  /**
   * Invoke the callback with no arguments.
   */
  operator fun invoke() = checkIfValid {
    invokeNative()
  }

  operator fun invoke(value: Any?) = checkIfValid {
    val result = JSTypeConverterProvider.convertToJSValue(value, useExperimentalConverter = true)
    if (result == null) {
      invokeNative()
      return
    }

    when (result) {
      is Int -> invokeNative(result)
      is Boolean -> invokeNative(result)
      is Double -> invokeNative(result)
      is Float -> invokeNative(result)
      is String -> invokeNative(result)
      is WritableNativeMap -> invokeNative(result.toHashMap())
      is WritableNativeArray -> invokeNative(result.toArrayList())
      is Collection<*> -> invokeNative(result)
      is Map<*, *> ->
        @Suppress("UNCHECKED_CAST")
        invokeNative(result as Map<String, Any?>)
      is IntArray -> invokeIntArray(result)
      is LongArray -> invokeLongArray(result)
      is FloatArray -> invokeFloatArray(result)
      is DoubleArray -> invokeDoubleArray(result)
      else -> invokeNative(result.toString())
    }
  }

  private external fun invokeNative()
  private external fun invokeNative(result: Int)
  private external fun invokeNative(result: Boolean)
  private external fun invokeNative(result: Double)
  private external fun invokeNative(result: Float)
  private external fun invokeNative(result: String)
  private external fun invokeNative(result: Collection<Any?>)
  private external fun invokeNative(result: Map<String, Any?>)

  private external fun invokeIntArray(result: IntArray)
  private external fun invokeLongArray(result: LongArray)
  private external fun invokeFloatArray(result: FloatArray)
  private external fun invokeDoubleArray(result: DoubleArray)

  private inline fun checkIfValid(body: () -> Unit) {
    try {
      body()
    } catch (e: Throwable) {
      if (!mHybridData.isValid) {
        logger.error("Invalidated JSCallback was invoked", e)
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
