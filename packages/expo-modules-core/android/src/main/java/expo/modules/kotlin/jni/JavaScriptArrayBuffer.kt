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
class JavaScriptArrayBuffer @DoNotStrip private constructor(@DoNotStrip private val mHybridData: HybridData) : Destructible {
  fun isValid() = mHybridData.isValid

  external fun size(): Int

  external fun readByte(position: Int): Byte
  external fun read2Byte(position: Int): Short
  external fun read4Byte(position: Int): Int
  external fun read8Byte(position: Int): Long
  external fun readFloat(position: Int): Float
  external fun readDouble(position: Int): Double

  external fun toDirectBuffer(): ByteBuffer

  /**
   * Creates a native-owned copy of this ArrayBuffer.
   */
  fun copy(): ArrayBuffer = ArrayBuffer.copyOf(toDirectBuffer())

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }
}
