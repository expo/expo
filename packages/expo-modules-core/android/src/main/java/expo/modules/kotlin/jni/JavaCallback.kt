package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.logger
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.JSTypeConverter
import expo.modules.kotlin.types.toJSValueExperimental

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaCallback @DoNotStrip internal constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  operator fun invoke(value: Any?) = checkIfValid {
    val result = JSTypeConverter.convertToJSValue(value, useExperimentalConverter = true)
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
      is Collection<*> -> invokeNative(result)
      is Map<*, *> ->
        @Suppress("UNCHECKED_CAST")
        invokeNative(result as Map<String, Any?>)
      is WritableNativeArray -> invokeNative(result)
      is WritableNativeMap -> invokeNative(result)
      is SharedObject -> invokeNative(result)
      is IntArray -> invokeIntArray(result)
      is LongArray -> invokeLongArray(result)
      is FloatArray -> invokeFloatArray(result)
      is DoubleArray -> invokeDoubleArray(result)
      else -> throw UnexpectedException("Unknown type: ${result.javaClass}")
    }
  }

  operator fun invoke() = checkIfValid {
    invokeNative()
  }

  operator fun invoke(result: Int) = checkIfValid {
    invokeNative(result)
  }

  operator fun invoke(result: Boolean) = checkIfValid {
    invokeNative(result)
  }

  operator fun invoke(result: Double) = checkIfValid {
    invokeNative(result)
  }

  operator fun invoke(result: Float) = checkIfValid {
    invokeNative(result)
  }

  operator fun invoke(result: String) = checkIfValid {
    invokeNative(result)
  }

  operator fun invoke(result: Collection<Any?>) = checkIfValid {
    invokeNative(result.toJSValueExperimental())
  }

  operator fun invoke(result: Map<String, Any?>) = checkIfValid {
    invokeNative(result.toJSValueExperimental())
  }

  operator fun invoke(code: String, errorMessage: String) = checkIfValid {
    invokeNative(code, errorMessage)
  }

  private external fun invokeNative()
  private external fun invokeNative(result: Int)
  private external fun invokeNative(result: Boolean)
  private external fun invokeNative(result: Double)
  private external fun invokeNative(result: Float)
  private external fun invokeNative(result: String)
  private external fun invokeNative(result: Collection<Any?>)
  private external fun invokeNative(result: Map<String, Any?>)
  private external fun invokeNative(result: WritableNativeArray)
  private external fun invokeNative(result: WritableNativeMap)
  private external fun invokeNative(result: SharedObject)
  private external fun invokeNative(code: String, errorMessage: String)

  private external fun invokeIntArray(result: IntArray)
  private external fun invokeLongArray(result: LongArray)
  private external fun invokeFloatArray(result: FloatArray)
  private external fun invokeDoubleArray(result: DoubleArray)

  private inline fun checkIfValid(body: () -> Unit) {
    try {
      body()
    } catch (e: Throwable) {
      if (!mHybridData.isValid) {
        // We know that this particular JavaCallback was invalidated, so it shouldn't be invoked.
        // To prevent crashes, we decided to suppress the error here.
        logger.error("Invalidated JavaCallback was invoked", e)
        return
      }
      throw e
    }
  }

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }
}
