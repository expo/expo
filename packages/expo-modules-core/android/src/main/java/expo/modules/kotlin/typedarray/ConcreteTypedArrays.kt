package expo.modules.kotlin.typedarray

import expo.modules.kotlin.jni.JavaScriptTypedArray

@Suppress("NOTHING_TO_INLINE")
private inline fun AnyTypedArray.checkIfInRange(index: Int) {
  if (index < 0 || index >= length) {
    throw IndexOutOfBoundsException()
  }
}

class Int8Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<Byte> {
  override operator fun get(index: Int): Byte {
    checkIfInRange(index)
    return readByte(index)
  }

  override operator fun set(index: Int, value: Byte) {
    checkIfInRange(index)
    writeByte(index, value)
  }
}

class Int16Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<Short> {
  override operator fun get(index: Int): Short {
    checkIfInRange(index)
    return read2Byte(index * 2)
  }

  override operator fun set(index: Int, value: Short) {
    checkIfInRange(index)
    write2Byte(index * 2, value)
  }
}

class Int32Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<Int> {
  override operator fun get(index: Int): Int {
    checkIfInRange(index)
    return read4Byte(index * 4)
  }

  override operator fun set(index: Int, value: Int) {
    checkIfInRange(index)
    write4Byte(index * 4, value)
  }
}

class Uint8Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<UByte> {
  override operator fun get(index: Int): UByte {
    checkIfInRange(index)
    return readByte(index).toUByte()
  }

  override operator fun set(index: Int, value: UByte) {
    checkIfInRange(index)
    writeByte(index, value.toByte())
  }
}

class Uint8ClampedArray(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<UByte> {
  override operator fun get(index: Int): UByte {
    checkIfInRange(index)
    return readByte(index).toUByte()
  }

  override operator fun set(index: Int, value: UByte) {
    checkIfInRange(index)
    writeByte(index, value.toByte())
  }
}

class Uint16Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<UShort> {
  override operator fun get(index: Int): UShort {
    checkIfInRange(index)
    return read2Byte(index * 2).toUShort()
  }

  override operator fun set(index: Int, value: UShort) {
    checkIfInRange(index)
    write2Byte(index * 2, value.toShort())
  }
}

class Uint32Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<UInt> {
  override operator fun get(index: Int): UInt {
    checkIfInRange(index)
    return read4Byte(index * 4).toUInt()
  }

  override operator fun set(index: Int, value: UInt) {
    checkIfInRange(index)
    write4Byte(index * 4, value.toInt())
  }
}

class Float32Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<Float> {
  override operator fun get(index: Int): Float {
    checkIfInRange(index)
    return readFloat(index * 4)
  }

  override operator fun set(index: Int, value: Float) {
    checkIfInRange(index)
    writeFloat(index * 4, value)
  }
}

class Float64Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<Double> {

  override operator fun get(index: Int): Double {
    checkIfInRange(index)
    return readDouble(index * 8)
  }

  override operator fun set(index: Int, value: Double) {
    checkIfInRange(index)
    writeDouble(index * 8, value)
  }
}

class BigInt64Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<Long> {
  override operator fun get(index: Int): Long {
    checkIfInRange(index)
    return read8Byte(index * 8)
  }

  override operator fun set(index: Int, value: Long) {
    checkIfInRange(index)
    write8Byte(index * 8, value)
  }
}

class BigUint64Array(private val rawArray: JavaScriptTypedArray)
  : AnyTypedArray by rawArray, GenericTypedArray<ULong> {
  override operator fun get(index: Int): ULong {
    checkIfInRange(index)
    return read8Byte(index * 8).toULong()
  }

  override operator fun set(index: Int, value: ULong) {
    checkIfInRange(index)
    write8Byte(index * 8, value.toLong())
  }
}
