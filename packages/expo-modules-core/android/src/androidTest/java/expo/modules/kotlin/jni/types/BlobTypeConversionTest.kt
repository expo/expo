@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.TypedArrayKind
import expo.modules.kotlin.jni.inlineModule
import expo.modules.kotlin.jni.waitForAsyncFunction
import expo.modules.kotlin.jni.withJSIInterop
import expo.modules.kotlin.typedarray.Uint8Array
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class BlobTypeConversionTest {
  @Test
  fun byteArray_should_be_convertible() = conversionTest<ByteArray>(
    jsValue = "new Uint8Array([0x00, 0xff])",
    nativeAssertion = { byteArray ->
      Truth.assertThat(byteArray[0]).isEqualTo(0x00.toByte())
      Truth.assertThat(byteArray[1]).isEqualTo(0xff.toByte())
    },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.isTypedArray()).isTrue()
      val rawTypedArray = jsValue.getTypedArray()
      val typedArray = Uint8Array(rawTypedArray)
      Truth.assertThat(typedArray.kind).isEqualTo(TypedArrayKind.Uint8Array)
      Truth.assertThat(typedArray[0]).isEqualTo(0x00.toUByte())
      Truth.assertThat(typedArray[1]).isEqualTo(0xff.toUByte())
    }
  )

  @Test
  fun byteArray_should_be_convertible_inside_map() = conversionTest<Map<String, ByteArray>>(
    jsValue = "{ key: new Uint8Array([0x00, 0xff]) }",
    nativeAssertion = { map ->
      Truth.assertThat(map["key"]?.get(0)).isEqualTo(0x00.toByte())
      Truth.assertThat(map["key"]?.get(1)).isEqualTo(0xff.toByte())
    },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getObject()["key"]?.isTypedArray()).isTrue()
      val rawTypedArray = jsValue.getObject()["key"]!!.getTypedArray()
      val typedArray = Uint8Array(rawTypedArray)
      Truth.assertThat(typedArray.kind).isEqualTo(TypedArrayKind.Uint8Array)
      Truth.assertThat(typedArray[0]).isEqualTo(0x00.toUByte())
      Truth.assertThat(typedArray[1]).isEqualTo(0xff.toUByte())
    }
  )

  @Test
  fun byteArray_should_be_convertible_async() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("echoAsync") { byteArray: ByteArray ->
        Truth.assertThat(byteArray[0]).isEqualTo(0x00.toByte())
        Truth.assertThat(byteArray[1]).isEqualTo(0xff.toByte())
        return@AsyncFunction byteArray
      }
    }
  ) { methodQueue ->
    val jsValue = waitForAsyncFunction(methodQueue, "expo.modules.TestModule.echoAsync(new Uint8Array([0x00, 0xff]))")
    Truth.assertThat(jsValue.isTypedArray()).isTrue()
    val rawTypedArray = jsValue.getTypedArray()
    val typedArray = Uint8Array(rawTypedArray)
    Truth.assertThat(typedArray.kind).isEqualTo(TypedArrayKind.Uint8Array)
    Truth.assertThat(typedArray[0]).isEqualTo(0x00.toUByte())
    Truth.assertThat(typedArray[1]).isEqualTo(0xff.toUByte())
  }

  @Test
  fun byteArray_should_be_convertible_inside_map_async() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("echoAsync") { map: Map<String, ByteArray> ->
        Truth.assertThat(map["key"]?.get(0)).isEqualTo(0x00.toByte())
        Truth.assertThat(map["key"]?.get(1)).isEqualTo(0xff.toByte())
        return@AsyncFunction map
      }
    }
  ) { methodQueue ->
    val jsValue = waitForAsyncFunction(methodQueue, "expo.modules.TestModule.echoAsync({ key: new Uint8Array([0x00, 0xff]) })").getObject()["key"]
    Truth.assertThat(jsValue?.isTypedArray()).isTrue()
    val rawTypedArray = jsValue!!.getTypedArray()
    val typedArray = Uint8Array(rawTypedArray)
    Truth.assertThat(typedArray.kind).isEqualTo(TypedArrayKind.Uint8Array)
    Truth.assertThat(typedArray[0]).isEqualTo(0x00.toUByte())
    Truth.assertThat(typedArray[1]).isEqualTo(0xff.toUByte())
  }
}
