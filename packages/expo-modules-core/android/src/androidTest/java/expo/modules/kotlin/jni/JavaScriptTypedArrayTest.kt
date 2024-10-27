@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.typedarray.Float32Array
import expo.modules.kotlin.typedarray.Float64Array
import expo.modules.kotlin.typedarray.Int16Array
import expo.modules.kotlin.typedarray.Int32Array
import expo.modules.kotlin.typedarray.Int8Array
import expo.modules.kotlin.typedarray.Uint16Array
import expo.modules.kotlin.typedarray.Uint32Array
import expo.modules.kotlin.typedarray.Uint8Array
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test
import java.nio.ByteBuffer
import java.nio.ByteOrder

internal class JavaScriptTypedArrayTest {
  @Test
  fun kind_should_return_correct_type() = withJSIInterop {
    val uint16Result = evaluateScript("new Uint16Array(4)")
    val float32Result = evaluateScript("new Float32Array([1.2, 3.4])")

    Truth.assertThat(uint16Result.isTypedArray()).isTrue()
    Truth.assertThat(float32Result.isTypedArray()).isTrue()

    val uintTypedArray = uint16Result.getTypedArray()
    Truth.assertThat(uintTypedArray.kind).isEqualTo(TypedArrayKind.Uint16Array)

    val float32TypedArray = float32Result.getTypedArray()
    Truth.assertThat(float32TypedArray.kind).isEqualTo(TypedArrayKind.Float32Array)
  }

  @Test
  fun should_be_able_access_elements_via_object_api() = withJSIInterop {
    val typedArray = evaluateScript("new Float32Array([1.2, 3.4])").getTypedArray()

    val first = typedArray.getProperty("0").getDouble()
    val second = typedArray.getProperty("1").getDouble()

    Truth.assertThat(first).isWithin(1.0e-6).of(1.2)
    Truth.assertThat(second).isWithin(1.0e-6).of(3.4)
  }

  @Test
  fun should_be_convertible_to_direct_buffer_float32() = withJSIInterop {
    val typedArray = evaluateScript("new Float32Array([1.2, 3.4])").getTypedArray()

    val buffer = typedArray.toDirectBuffer()

    Truth.assertThat(buffer.isDirect).isTrue()
    Truth.assertThat(buffer.isReadOnly).isFalse()

    val first = buffer.getFloat(0)
    val second = buffer.getFloat(4)

    Truth.assertThat(first).isEqualTo(1.2f)
    Truth.assertThat(second).isEqualTo(3.4f)
  }

  @Test
  fun should_be_convertible_to_direct_buffer_int32() = withJSIInterop {
    val typedArray = evaluateScript("new Int32Array([21, 31])").getTypedArray()

    val buffer = typedArray.toDirectBuffer()

    Truth.assertThat(buffer.isDirect).isTrue()
    Truth.assertThat(buffer.isReadOnly).isFalse()

    val first = buffer.getInt(0)
    val second = buffer.getInt(4)

    Truth.assertThat(first).isEqualTo(21)
    Truth.assertThat(second).isEqualTo(31)
  }

  @Test
  fun should_be_convertible_to_direct_buffer_int8() = withJSIInterop {
    val typedArray = evaluateScript("new Int8Array([21, 31])").getTypedArray()

    val buffer = typedArray.toDirectBuffer()

    Truth.assertThat(buffer.isDirect).isTrue()
    Truth.assertThat(buffer.isReadOnly).isFalse()

    val first = buffer.get(0)
    val second = buffer.get(1)

    Truth.assertThat(first).isEqualTo(21)
    Truth.assertThat(second).isEqualTo(31)
  }

  @Test
  fun raw_read() = withJSIInterop {
    val typedArray = evaluateScript("new Int32Array([21, 31])").getTypedArray()

    val firstBytes = ByteArray(4)
    val secondBytes = ByteArray(4)
    typedArray.read(firstBytes, 0, 4)
    typedArray.read(secondBytes, 4, 4)

    val first = wrapBytes(firstBytes).int
    val second = wrapBytes(secondBytes).int

    Truth.assertThat(first).isEqualTo(21)
    Truth.assertThat(second).isEqualTo(31)
  }

  @Test
  fun raw_write() = withJSIInterop {
    val typedArray = evaluateScript("new Int32Array([21, 31])").getTypedArray()

    val bytes = ByteArray(4)
    wrapBytes(bytes).putInt(21345)

    typedArray.write(bytes, 4, 4)

    val first = typedArray.getProperty("0").getDouble().toInt()
    val second = typedArray.getProperty("1").getDouble().toInt()

    Truth.assertThat(first).isEqualTo(21)
    Truth.assertThat(second).isEqualTo(21345)
  }

  @Test
  fun int8_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Int8Array([-128, 127])").getTypedArray()
    val typedArray = Int8Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-128)
    Truth.assertThat(second).isEqualTo(127)
  }

  @Test
  fun int8_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Int8Array(2)").getTypedArray()
    val typedArray = Int8Array(rawTypedArray)

    typedArray[0] = -128
    typedArray[1] = 127

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-128)
    Truth.assertThat(second).isEqualTo(127)
  }

  @Test
  fun int16_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Int16Array([-32768, 32767])").getTypedArray()
    val typedArray = Int16Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-32768)
    Truth.assertThat(second).isEqualTo(32767)
  }

  @Test
  fun int16_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Int16Array([0, 0])").getTypedArray()
    val typedArray = Int16Array(rawTypedArray)

    typedArray[0] = -32768
    typedArray[1] = 32767

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-32768)
    Truth.assertThat(second).isEqualTo(32767)
  }

  @Test
  fun int32_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Int32Array([-2147483648, 2147483647])").getTypedArray()
    val typedArray = Int32Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-2147483648)
    Truth.assertThat(second).isEqualTo(2147483647)
  }

  @Test
  fun int32_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Int32Array(2)").getTypedArray()
    val typedArray = Int32Array(rawTypedArray)

    typedArray[0] = -2147483648
    typedArray[1] = 2147483647

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-2147483648)
    Truth.assertThat(second).isEqualTo(2147483647)
  }

  @Test
  fun uint8_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint8Array([1, 255])").getTypedArray()
    val typedArray = Uint8Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(1.toUByte())
    Truth.assertThat(second).isEqualTo(255.toUByte())
  }

  @Test
  fun uint8_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint8Array(2)").getTypedArray()
    val typedArray = Uint8Array(rawTypedArray)

    typedArray[0] = 10u
    typedArray[1] = 255u

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(10.toUByte())
    Truth.assertThat(second).isEqualTo(255.toUByte())
  }

  @Test
  fun uint8clamped_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint8ClampedArray([1, 255])").getTypedArray()
    val typedArray = Uint8Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(1.toUByte())
    Truth.assertThat(second).isEqualTo(255.toUByte())
  }

  @Test
  fun uint8clamped_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint8ClampedArray(2)").getTypedArray()
    val typedArray = Uint8Array(rawTypedArray)

    typedArray[0] = 10u
    typedArray[1] = 255u

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(10.toUByte())
    Truth.assertThat(second).isEqualTo(255.toUByte())
  }

  @Test
  fun uint16_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint16Array([123, 65535])").getTypedArray()
    val typedArray = Uint16Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(123.toUShort())
    Truth.assertThat(second).isEqualTo(65535.toUShort())
  }

  @Test
  fun uint16_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint16Array(2)").getTypedArray()
    val typedArray = Uint16Array(rawTypedArray)

    typedArray[0] = 123.toUShort()
    typedArray[1] = 65535.toUShort()

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(123.toUShort())
    Truth.assertThat(second).isEqualTo(65535.toUShort())
  }

  @Test
  fun uint32_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint32Array([123, 4294967295])").getTypedArray()
    val typedArray = Uint32Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(123.toUInt())
    Truth.assertThat(second).isEqualTo(4294967295.toUInt())
  }

  @Test
  fun uint32_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Uint32Array(2)").getTypedArray()
    val typedArray = Uint32Array(rawTypedArray)

    typedArray[0] = 123.toUInt()
    typedArray[1] = 4294967295.toUInt()

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(123.toUInt())
    Truth.assertThat(second).isEqualTo(4294967295.toUInt())
  }

  @Test
  fun float32_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Float32Array([-1.12432, 987765.3])").getTypedArray()
    val typedArray = Float32Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-1.12432f)
    Truth.assertThat(second).isEqualTo(987765.3f)
  }

  @Test
  fun float32_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Float32Array(2)").getTypedArray()
    val typedArray = Float32Array(rawTypedArray)

    typedArray[0] = -1.12432f
    typedArray[1] = 987765.3f

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-1.12432f)
    Truth.assertThat(second).isEqualTo(987765.3f)
  }

  @Test
  fun float64_read() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Float64Array([-1.12432, 987765.312])").getTypedArray()
    val typedArray = Float64Array(rawTypedArray)

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-1.12432)
    Truth.assertThat(second).isEqualTo(987765.312)
  }

  @Test
  fun float64_write() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Float64Array(2)").getTypedArray()
    val typedArray = Float64Array(rawTypedArray)

    typedArray[0] = -1.12432
    typedArray[1] = 987765.312

    val first = typedArray[0]
    val second = typedArray[1]

    Truth.assertThat(first).isEqualTo(-1.12432)
    Truth.assertThat(second).isEqualTo(987765.312)
  }

  @Test
  fun length_should_return_correct_value() = withJSIInterop {
    val rawTypedArray = evaluateScript("new Float64Array(16)").getTypedArray()
    val typedArray = Float64Array(rawTypedArray)

    Truth.assertThat(typedArray.length).isEqualTo(16)
  }

  private fun wrapBytes(array: ByteArray): ByteBuffer = ByteBuffer.wrap(array).order(ByteOrder.nativeOrder())
}
