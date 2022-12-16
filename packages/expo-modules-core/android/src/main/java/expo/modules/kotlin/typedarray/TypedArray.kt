package expo.modules.kotlin.typedarray

import expo.modules.kotlin.jni.TypedArrayKind
import java.nio.ByteBuffer

/**
 * The base interface for any type of the typed array.
 */
interface TypedArray {
  /**
   * Returns the kind of the typed array, such as `Int8Array` or `Float32Array`.
   */
  val kind: TypedArrayKind

  /**
   * Returns the number of elements held in the typed array.
   * Fixed at construction time and thus read only.
   */
  val length: Int

  /**
   * The length in bytes from the start of the underlying ArrayBuffer.
   * Fixed at construction time and thus read-only.
   */
  val byteLength: Int

  /**
   * The offset in bytes from the start of the underlying ArrayBuffer.
   * Fixed at construction time and thus read-only.
   */
  val byteOffset: Int

  /**
   * Converts typed array into a direct byte buffer.
   */
  fun toDirectBuffer(): ByteBuffer

  fun read(buffer: ByteArray, position: Int, size: Int)
  fun write(buffer: ByteArray, position: Int, size: Int)

  fun readByte(position: Int): Byte
  fun read2Byte(position: Int): Short
  fun read4Byte(position: Int): Int
  fun read8Byte(position: Int): Long
  fun readFloat(position: Int): Float
  fun readDouble(position: Int): Double

  fun writeByte(position: Int, value: Byte)
  fun write2Byte(position: Int, value: Short)
  fun write4Byte(position: Int, value: Int)
  fun write8Byte(position: Int, value: Long)
  fun writeFloat(position: Int, value: Float)
  fun writeDouble(position: Int, value: Double)
}
