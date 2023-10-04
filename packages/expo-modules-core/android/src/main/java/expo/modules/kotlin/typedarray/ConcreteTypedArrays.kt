package expo.modules.kotlin.typedarray

import expo.modules.kotlin.jni.JavaScriptTypedArray

@Suppress("NOTHING_TO_INLINE")
private inline fun TypedArray.checkIfInRange(index: Int) {
  if (index < 0 || index >= length) {
    throw IndexOutOfBoundsException()
  }
}

interface RawTypedArrayHolder {
  val rawArray: JavaScriptTypedArray
}

class Int8Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<Byte>, RawTypedArrayHolder {
  override operator fun get(index: Int): Byte {
    checkIfInRange(index)
    return readByte(index * Byte.SIZE_BYTES)
  }

  override operator fun set(index: Int, value: Byte) {
    checkIfInRange(index)
    writeByte(index * Byte.SIZE_BYTES, value)
  }
}

class Int16Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<Short>, RawTypedArrayHolder {
  override operator fun get(index: Int): Short {
    checkIfInRange(index)
    return read2Byte(index * Short.SIZE_BYTES)
  }

  override operator fun set(index: Int, value: Short) {
    checkIfInRange(index)
    write2Byte(index * Short.SIZE_BYTES, value)
  }
}

class Int32Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<Int>, RawTypedArrayHolder {
  override operator fun get(index: Int): Int {
    checkIfInRange(index)
    return read4Byte(index * Int.SIZE_BYTES)
  }

  override operator fun set(index: Int, value: Int) {
    checkIfInRange(index)
    write4Byte(index * Int.SIZE_BYTES, value)
  }
}

class Uint8Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<UByte>, RawTypedArrayHolder {
  override operator fun get(index: Int): UByte {
    checkIfInRange(index)
    return readByte(index * UByte.SIZE_BYTES).toUByte()
  }

  override operator fun set(index: Int, value: UByte) {
    checkIfInRange(index)
    writeByte(index * UByte.SIZE_BYTES, value.toByte())
  }
}

class Uint8ClampedArray(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<UByte>, RawTypedArrayHolder {
  override operator fun get(index: Int): UByte {
    checkIfInRange(index)
    return readByte(index * UByte.SIZE_BYTES).toUByte()
  }

  override operator fun set(index: Int, value: UByte) {
    checkIfInRange(index)
    writeByte(index * UByte.SIZE_BYTES, value.toByte())
  }
}

class Uint16Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<UShort>, RawTypedArrayHolder {
  override operator fun get(index: Int): UShort {
    checkIfInRange(index)
    return read2Byte(index * UShort.SIZE_BYTES).toUShort()
  }

  override operator fun set(index: Int, value: UShort) {
    checkIfInRange(index)
    write2Byte(index * UShort.SIZE_BYTES, value.toShort())
  }
}

class Uint32Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<UInt>, RawTypedArrayHolder {
  override operator fun get(index: Int): UInt {
    checkIfInRange(index)
    return read4Byte(index * UInt.SIZE_BYTES).toUInt()
  }

  override operator fun set(index: Int, value: UInt) {
    checkIfInRange(index)
    write4Byte(index * UInt.SIZE_BYTES, value.toInt())
  }
}

class Float32Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<Float>, RawTypedArrayHolder {
  override operator fun get(index: Int): Float {
    checkIfInRange(index)
    return readFloat(index * Float.SIZE_BYTES)
  }

  override operator fun set(index: Int, value: Float) {
    checkIfInRange(index)
    writeFloat(index * Float.SIZE_BYTES, value)
  }
}

class Float64Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<Double>, RawTypedArrayHolder {

  override operator fun get(index: Int): Double {
    checkIfInRange(index)
    return readDouble(index * Double.SIZE_BYTES)
  }

  override operator fun set(index: Int, value: Double) {
    checkIfInRange(index)
    writeDouble(index * Double.SIZE_BYTES, value)
  }
}

class BigInt64Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<Long>, RawTypedArrayHolder {
  override operator fun get(index: Int): Long {
    checkIfInRange(index)
    return read8Byte(index * Long.SIZE_BYTES)
  }

  override operator fun set(index: Int, value: Long) {
    checkIfInRange(index)
    write8Byte(index * Long.SIZE_BYTES, value)
  }
}

class BigUint64Array(override val rawArray: JavaScriptTypedArray) :
  TypedArray by rawArray, GenericTypedArray<ULong>, RawTypedArrayHolder {
  override operator fun get(index: Int): ULong {
    checkIfInRange(index)
    return read8Byte(index * ULong.SIZE_BYTES).toULong()
  }

  override operator fun set(index: Int, value: ULong) {
    checkIfInRange(index)
    write8Byte(index * ULong.SIZE_BYTES, value.toLong())
  }
}
