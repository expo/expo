@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.JavaScriptArrayBuffer
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JavaScriptArrayBufferConversionTest {
  @Test
  fun array_buffer_should_be_convertible() = conversionTest<JavaScriptArrayBuffer, _>(
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
}
