@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

internal class JavaScriptArrayBufferTest {
  @Test
  fun should_be_retrievable_from_js_value() = withJSIInterop {
    val jsObject = evaluateScript("new Uint8Array([1,2,3,4]).buffer").getObject()
    Truth.assertThat(jsObject.isArrayBuffer()).isTrue()

    val arrayBuffer = jsObject.getArrayBuffer()
    Truth.assertThat(arrayBuffer.size()).isEqualTo(4)
  }

  @Test
  fun should_be_able_access_elements_via_object_api() = withJSIInterop {
    val arrayBuffer = evaluateScript("new Int16Array([2317, 9001]).buffer").getObject().getArrayBuffer()

    val first = arrayBuffer.read2Byte(0)
    val second = arrayBuffer.read2Byte(2)

    Truth.assertThat(first).isEqualTo(2317)
    Truth.assertThat(second).isEqualTo(9001)
  }

  @Test
  fun should_be_convertible_to_direct_buffer() = withJSIInterop {
    val arrayBuffer = evaluateScript("new Float32Array([1.2, 3.4]).buffer").getObject().getArrayBuffer()
    val buffer = arrayBuffer.toDirectBuffer()

    Truth.assertThat(buffer.isDirect).isTrue()
    Truth.assertThat(buffer.isReadOnly).isFalse()

    val first = buffer.getFloat(0)
    val second = buffer.getFloat(4)

    Truth.assertThat(first).isEqualTo(1.2f)
    Truth.assertThat(second).isEqualTo(3.4f)
  }

  @Test
  fun should_be_copyable_to_native_buffer() = withJSIInterop {
    val jsBuffer = evaluateScript("new Uint8Array([1,2,3,4]).buffer").getObject().getArrayBuffer()

    val nativeBuffer = jsBuffer.copy()

    Truth.assertThat(nativeBuffer.size()).isEqualTo(jsBuffer.size())

    nativeBuffer.toDirectBuffer().apply {
      rewind()
      put(0x42.toByte())
    }
    Truth.assertThat(jsBuffer.readByte(0)).isEqualTo(1.toByte())
    Truth.assertThat(nativeBuffer.readByte(0)).isEqualTo(0x42.toByte())
  }
}
