package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import org.junit.Test

class BasicTypeConverterTest {
  @Test
  fun `should convert to float array`() {
    val dynamic = DynamicFromObject(
      JavaOnlyArray().apply {
        pushDouble(1.0)
        pushDouble(2.0)
        pushDouble(3.0)
      }
    )

    val converted = convert<FloatArray>(dynamic)

    Truth.assertThat(converted).isInstanceOf(FloatArray::class.java)
    Truth.assertThat(converted).usingExactEquality().containsExactly(1f, 2f, 3f)
  }
}
