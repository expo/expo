@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.JavaScriptArrayBuffer
import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.jni.inlineModule
import expo.modules.kotlin.jni.withJSIInterop
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class ArrayBufferConversionTest {
  @Test
  fun js_array_buffer_should_be_convertible() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
      Truth.assertThat(arrayBuffer.read2Byte(0)).isEqualTo(-256)
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun js_array_buffer_should_be_returned() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
    },
    map = { it },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getObject().isArrayBuffer()).isTrue()

      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
    }
  )

  @Test
  fun js_array_buffer_can_be_modified() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())

      arrayBuffer.toDirectBuffer().apply {
        rewind()
        put(0x42.toByte())
      }
    },
    map = { it },
    jsAssertion = { jsValue ->
      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x42.toByte())
    }
  )

  @Test
  fun native_array_buffer_should_be_convertible() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
      Truth.assertThat(arrayBuffer.read2Byte(0)).isEqualTo(-256)
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun native_array_buffer_should_be_returned() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
    },
    map = { it },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getObject().isArrayBuffer()).isTrue()

      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
    }
  )

  @Test
  fun native_array_buffer_can_be_modified() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff]).buffer",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())

      arrayBuffer.toDirectBuffer().apply {
        rewind()
        put(0x42.toByte())
      }
    },
    map = { it },
    jsAssertion = { jsValue ->
      val arrayBuffer = jsValue.getObject().getArrayBuffer()
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x42.toByte())
    }
  )

  @Test
  fun native_array_buffer_arg_should_be_a_copy() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("conversionTest") { buffer: NativeArrayBuffer ->
        buffer.toDirectBuffer().apply {
          rewind()
          put(0x42.toByte())
        }
        return@Function buffer
      }
    }
  ) {
    val (original, copied) = evaluateScript(
      """
        const originalBuffer = new Uint8Array([1, 2]).buffer;
        const copiedBuffer = expo.modules.TestModule.conversionTest(originalBuffer);
        [originalBuffer, copiedBuffer]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(original.getObject().isArrayBuffer()).isTrue()
    Truth.assertThat(copied.getObject().isArrayBuffer()).isTrue()

    val originalBuffer = original.getObject().getArrayBuffer()
    val copiedBuffer = copied.getObject().getArrayBuffer()

    Truth.assertThat(originalBuffer.readByte(0)).isEqualTo(1.toByte())
    Truth.assertThat(copiedBuffer.readByte(0)).isEqualTo(0x42.toByte())
  }
}
