@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.ArrayBuffer
import expo.modules.kotlin.jni.JavaScriptArrayBuffer
import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.jni.inlineModule
import expo.modules.kotlin.jni.withJSIInterop
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class ArrayBufferConversionTest {
  @Test
  fun array_buffer_should_be_convertible() = conversionTest<ArrayBuffer, _>(
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
  fun array_buffer_should_be_returned() = conversionTest<ArrayBuffer, _>(
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
  fun array_buffer_arg_should_be_a_copy_for_js_allocated_array_buffer() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("conversionTest") { buffer: ArrayBuffer ->
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

    val originalBuffer = original.getObject().getArrayBuffer()
    val copiedBuffer = copied.getObject().getArrayBuffer()

    Truth.assertThat(originalBuffer.readByte(0)).isEqualTo(1.toByte())
    Truth.assertThat(copiedBuffer.readByte(0)).isEqualTo(0x42.toByte())
  }

  @Test
  fun array_buffer_arg_should_share_native_backed_array_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createArrayBuffer(4);
        const view = new Uint8Array(buffer);
        view.fill(1);
        const processedBuffer = expo.modules.TestModule.fillArrayBuffer(buffer, 0x42);
        [Array.from(view), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
  }

  @Test
  fun array_buffer_typed_array_arg_should_share_native_backed_view_range() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createArrayBuffer(5);
        const fullView = new Uint8Array(buffer);
        fullView.set([1, 2, 3, 4, 5]);
        const partialView = new Uint8Array(buffer, 1, 2);
        const processedBuffer = expo.modules.TestModule.fillArrayBuffer(partialView, 0x42);
        [Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 0x42, 0x42, 4, 5).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  @Test
  fun array_buffer_typed_array_arg_should_copy_js_allocated_view() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        const fullView = new Uint8Array(buffer);
        const partialView = new Uint8Array(buffer, 1, 2);
        const processedBuffer = expo.modules.TestModule.fillArrayBuffer(partialView, 0x42);
        [Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 2, 3, 4, 5).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  @Test
  fun java_script_object_get_array_buffer_should_still_return_legacy_js_array_buffer() = withJSIInterop {
    val jsObject = evaluateScript("new Uint8Array([1, 2, 3]).buffer").getObject()
    val arrayBuffer: JavaScriptArrayBuffer = jsObject.getArrayBuffer()

    Truth.assertThat(arrayBuffer.size()).isEqualTo(3)
    Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(1.toByte())
  }

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
  fun js_array_buffer_accepts_full_typed_array() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array([0x00, 0xff])",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(0xff.toByte())
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun js_array_buffer_accepts_partial_typed_array_view() = conversionTest<JavaScriptArrayBuffer, _>(
    jsValue = "new Uint8Array(new Uint8Array([1,2,3,4,5]).buffer, 1, 2)",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(2.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(3.toByte())
    },
    map = {},
    jsAssertion = {}
  )

  @Test
  fun native_array_buffer_accepts_partial_typed_array_view() = conversionTest<NativeArrayBuffer, _>(
    jsValue = "new Uint8Array(new Uint8Array([1,2,3,4,5]).buffer, 1, 2)",
    nativeAssertion = { arrayBuffer ->
      Truth.assertThat(arrayBuffer.size()).isEqualTo(2)
      Truth.assertThat(arrayBuffer.readByte(0)).isEqualTo(2.toByte())
      Truth.assertThat(arrayBuffer.readByte(1)).isEqualTo(3.toByte())
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

  @Test
  fun native_array_buffer_arg_should_share_native_backed_array_buffer() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createNative(4);
        const view = new Uint8Array(buffer);
        view.fill(1);
        const processedBuffer = expo.modules.TestModule.fillNativeBuffer(buffer, 0x42);
        [Array.from(view), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
  }

  @Test
  fun returned_native_backed_array_buffer_should_outlive_native_argument_wrapper() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    evaluateScript(
      """
        globalThis.retainedBuffer = (() => {
          const sourceBuffer = expo.modules.TestModule.createNative(4);
          new Uint8Array(sourceBuffer).set([1, 2, 3, 4]);
          return expo.modules.TestModule.fillNativeBuffer(sourceBuffer, 0x42);
        })();
      """.trimIndent()
    )

    forceGc()

    val result = evaluateScript("Array.from(new Uint8Array(globalThis.retainedBuffer))").getArray()
    Truth.assertThat(result.map { it.getInt() }).containsExactly(0x42, 0x42, 0x42, 0x42).inOrder()
  }

  @Test
  fun native_array_buffer_typed_array_arg_should_share_native_backed_view_range() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = expo.modules.TestModule.createNative(5);
        const fullView = new Uint8Array(buffer);
        fullView.set([1, 2, 3, 4, 5]);
        const partialView = new Uint8Array(buffer, 1, 2);
        const processedBuffer = expo.modules.TestModule.fillNativeBuffer(partialView, 0x42);
        [Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 0x42, 0x42, 4, 5).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  @Test
  fun native_array_buffer_typed_array_arg_should_copy_js_allocated_view() = withJSIInterop(
    nativeBackedArrayBufferModule()
  ) {
    val result = evaluateScript(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        const fullView = new Uint8Array(buffer);
        const partialView = new Uint8Array(buffer, 1, 2);
        const processedBuffer = expo.modules.TestModule.fillNativeBuffer(partialView, 0x42);
        [Array.from(fullView), Array.from(new Uint8Array(processedBuffer))]
      """.trimIndent()
    ).getArray()

    Truth.assertThat(result[0].getArray().map { it.getInt() }).containsExactly(1, 2, 3, 4, 5).inOrder()
    Truth.assertThat(result[1].getArray().map { it.getInt() }).containsExactly(0x42, 0x42).inOrder()
  }

  private fun nativeBackedArrayBufferModule() = inlineModule {
    Name("TestModule")

    Function("createNative") { size: Int ->
      NativeArrayBuffer.allocate(size)
    }

    Function("createArrayBuffer") { size: Int ->
      ArrayBuffer.allocate(size)
    }

    Function("fillNativeBuffer") { buffer: NativeArrayBuffer, value: Int ->
      buffer.toDirectBuffer().apply {
        rewind()
        while (hasRemaining()) {
          put(value.toByte())
        }
      }
      buffer
    }

    Function("fillArrayBuffer") { buffer: ArrayBuffer, value: Int ->
      buffer.toDirectBuffer().apply {
        rewind()
        while (hasRemaining()) {
          put(value.toByte())
        }
      }
      buffer
    }
  }

  private fun forceGc() {
    repeat(5) {
      System.gc()
      System.runFinalization()
      Thread.sleep(10)
    }
  }
}
