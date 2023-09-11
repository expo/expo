package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.UnexpectedException

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaCallback @DoNotStrip internal constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  operator fun invoke(result: Any?) {
    if (result == null) {
      invoke()
      return
    }
    when (result) {
      is Int -> invoke(result)
      is Boolean -> invoke(result)
      is Double -> invoke(result)
      is Float -> invoke(result)
      is String -> invoke(result)
      is WritableNativeArray -> invoke(result)
      is WritableNativeMap -> invoke(result)
      else -> throw UnexpectedException("Unknown type: ${result.javaClass}")
    }
  }

  private external fun invoke()
  private external fun invoke(result: Int)
  private external fun invoke(result: Boolean)
  private external fun invoke(result: Double)
  private external fun invoke(result: Float)
  private external fun invoke(result: String)
  private external fun invoke(result: WritableNativeArray)
  private external fun invoke(result: WritableNativeMap)

  @Throws(Throwable::class)
  protected fun finalize() {
    deallocate()
  }

  override fun deallocate() {
    mHybridData.resetNative()
  }
}
