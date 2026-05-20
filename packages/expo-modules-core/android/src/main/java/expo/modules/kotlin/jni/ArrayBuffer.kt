package expo.modules.kotlin.jni

import java.nio.ByteBuffer

/**
 * Abstracts common operations that can be done on
 * [NativeArrayBuffer] and [JavaScriptArrayBuffer].
 */
interface ArrayBuffer {
  fun size(): Int

  fun readByte(position: Int): Byte
  fun read2Byte(position: Int): Short
  fun read4Byte(position: Int): Int
  fun read8Byte(position: Int): Long
  fun readFloat(position: Int): Float
  fun readDouble(position: Int): Double

  /**
   * Returns a direct [ByteBuffer] that wraps this ArrayBuffer's underlying data.
   */
  fun toDirectBuffer(): ByteBuffer

  /**
   * Creates a native-owned copy of this ArrayBuffer.
   */
  fun copy(): NativeArrayBuffer = NativeArrayBuffer.copyOf(this)
}
