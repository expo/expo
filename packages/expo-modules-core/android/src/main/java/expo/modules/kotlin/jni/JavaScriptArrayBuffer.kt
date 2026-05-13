package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import java.nio.ByteBuffer

/**
 * A Kotlin representation of jsi::Value.
 * Should be used only on the runtime thread.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptArrayBuffer @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible, ArrayBuffer {
  fun isValid() = mHybridData.isValid

  external override fun size(): Int

  external override fun readByte(position: Int): Byte
  external override fun read2Byte(position: Int): Short
  external override fun read4Byte(position: Int): Int
  external override fun read8Byte(position: Int): Long
  external override fun readFloat(position: Int): Float
  external override fun readDouble(position: Int): Double

  external override fun toDirectBuffer(): ByteBuffer

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }
}
