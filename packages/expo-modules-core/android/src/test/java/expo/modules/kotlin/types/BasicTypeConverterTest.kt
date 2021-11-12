@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import org.junit.Test
import kotlin.reflect.typeOf

class BasicTypeConverterTest {
  private val converter = BasicTypeConverter()

  @Test
  fun `should convert to float array`() {
    val dynamic = DynamicFromObject(
      JavaOnlyArray().apply {
        pushDouble(1.0)
        pushDouble(2.0)
        pushDouble(3.0)
      }
    )

    val converted = converter.convert(dynamic, KClassTypeWrapper(typeOf<FloatArray>()))

    Truth.assertThat(converted).isInstanceOf(FloatArray::class.java)
    Truth.assertThat(converted as FloatArray).usingExactEquality().containsExactly(1f, 2f, 3f)
  }
}
