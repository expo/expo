package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.Exceptions
import java.nio.ByteBuffer

/**
 * A Kotlin representation of an ArrayBuffer with native-owned or native-retained storage.
 * Can be created on any thread and safely returned to JavaScript.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class ArrayBuffer : Destructible {
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

  external fun size(): Int

  external fun readByte(position: Int): Byte
  external fun read2Byte(position: Int): Short
  external fun read4Byte(position: Int): Int
  external fun read8Byte(position: Int): Long
  external fun readFloat(position: Int): Float
  external fun readDouble(position: Int): Double

  /**
   * Returns a direct [ByteBuffer] that wraps this ArrayBuffer's underlying data.
   */
  external fun toDirectBuffer(): ByteBuffer

  /**
   * Creates a native-owned copy of this ArrayBuffer.
   */
  fun copy(): ArrayBuffer = copyOf(this)

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }

  companion object {
    /**
     * Allocate a new [ArrayBuffer] with the given [size].
     */
    fun allocate(size: Int): ArrayBuffer {
      val buffer = ByteBuffer.allocateDirect(size)
      return ArrayBuffer(buffer)
    }

    /**
     * Wrap the given [ByteBuffer] in a new **owning** `ArrayBuffer`.
     * The buffer must be direct, otherwise the function throws.
     * Use [ArrayBuffer.copyOf] for non-direct buffers.
     */
    fun wrap(byteBuffer: ByteBuffer): ArrayBuffer =
      ArrayBuffer(byteBuffer.apply { rewind() })

    /**
     * Copy given [ArrayBuffer] into a new native-owned `ArrayBuffer`.
     */
    fun copyOf(other: ArrayBuffer): ArrayBuffer =
      copyOf(other.toDirectBuffer())

    /**
     * Copy given [JavaScriptArrayBuffer] into a new native-owned `ArrayBuffer`.
     */
    fun copyOf(other: JavaScriptArrayBuffer): ArrayBuffer =
      copyOf(other.toDirectBuffer())

    /**
     * Copy given [NativeArrayBuffer] into a new native-owned `ArrayBuffer`.
     */
    @Suppress("DEPRECATION")
    fun copyOf(other: NativeArrayBuffer): ArrayBuffer =
      copyOf(other.toDirectBuffer())

    fun copyOf(byteBuffer: ByteBuffer): ArrayBuffer {
      val size = byteBuffer.run {
        rewind()
        remaining()
      }
      val newBuffer = ByteBuffer.allocateDirect(size).apply {
        put(byteBuffer)
        rewind()
      }
      byteBuffer.rewind()
      return ArrayBuffer(newBuffer)
    }
  }
}
