package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.Exceptions
import java.nio.ByteBuffer

/**
 * A Kotlin representation of native-owned ArrayBuffer.
 * Can be created on any thread and safely returned to JavaScript.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class NativeArrayBuffer : Destructible, ArrayBuffer {
  @DoNotStrip private val mHybridData: HybridData

  @DoNotStrip
  @Suppress("unused")
  private constructor(hybridData: HybridData) {
    mHybridData = hybridData
  }

  constructor(byteBuffer: ByteBuffer) {
    if (!byteBuffer.isDirect) {
      throw Exceptions.IllegalArgument("ArrayBuffers can only be created from direct ByteBuffers")
    }
    mHybridData = initHybrid(byteBuffer)
  }

  private external fun initHybrid(buffer: ByteBuffer): HybridData

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

  companion object {
    /**
     * Allocate a new [NativeArrayBuffer] with the given [size].
     */
    fun allocate(size: Int): NativeArrayBuffer {
      val buffer = ByteBuffer.allocateDirect(size)
      return NativeArrayBuffer(buffer)
    }

    /**
     * Wrap the given [ByteBuffer] in a new **owning** `ArrayBuffer`.
     * The buffer must be direct, otherwise the function throws.
     * Use [NativeArrayBuffer.copyOf] for non-direct buffers.
     */
    fun wrap(byteBuffer: ByteBuffer): NativeArrayBuffer =
      NativeArrayBuffer(byteBuffer.apply { rewind() })

    /**
     * Copy given [ArrayBuffer] into a new native-owned `ArrayBuffer`.
     */
    fun copyOf(other: ArrayBuffer): NativeArrayBuffer =
      copyOf(other.toDirectBuffer())

    fun copyOf(byteBuffer: ByteBuffer): NativeArrayBuffer {
      val size = byteBuffer.run {
        rewind()
        remaining()
      }
      val newBuffer = ByteBuffer.allocateDirect(size).apply {
        put(byteBuffer)
        rewind()
      }
      byteBuffer.rewind()
      return NativeArrayBuffer(newBuffer)
    }
  }
}
