package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.typedarray.TypedArray
import java.nio.ByteBuffer

private var nextValue = 1

private fun nextValue(): Int = nextValue++

enum class TypedArrayKind(val value: Int = nextValue()) {
  Int8Array,
  Int16Array,
  Int32Array,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,
}

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class JavaScriptTypedArray @DoNotStrip constructor(hybridData: HybridData) :
  JavaScriptObject(hybridData), TypedArray {

  override val kind: TypedArrayKind by lazy {
    val rawKind = getRawKind()
    TypedArrayKind.values().first { it.value == rawKind }
  }

  override val length: Int by lazy {
    getProperty("length").getDouble().toInt()
  }

  override val byteLength: Int by lazy {
    getProperty("byteLength").getDouble().toInt()
  }

  override val byteOffset: Int by lazy {
    getProperty("byteOffset").getDouble().toInt()
  }

  private external fun getRawKind(): Int

  external override fun toDirectBuffer(): ByteBuffer

  external override fun read(buffer: ByteArray, position: Int, size: Int)
  external override fun write(buffer: ByteArray, position: Int, size: Int)

  external override fun readByte(position: Int): Byte
  external override fun read2Byte(position: Int): Short
  external override fun read4Byte(position: Int): Int
  external override fun read8Byte(position: Int): Long
  external override fun readFloat(position: Int): Float

  external override fun readDouble(position: Int): Double
  external override fun writeByte(position: Int, value: Byte)
  external override fun write2Byte(position: Int, value: Short)
  external override fun write4Byte(position: Int, value: Int)
  external override fun write8Byte(position: Int, value: Long)
  external override fun writeFloat(position: Int, value: Float)

  external override fun writeDouble(position: Int, value: Double)
}
