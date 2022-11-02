package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.google.common.truth.Truth
import expo.modules.kotlin.exception.NullArgumentException
import org.junit.Test

internal class AnyTypeConverterTest {
  @Test
  fun `should unwrap dynamic type`() {
    val dynamic = DynamicFromObject(20.0)

    val converted = convert<Any>(dynamic)

    Truth.assertThat(converted).isInstanceOf(java.lang.Double::class.java)
    Truth.assertThat(converted as Double).isEqualTo(20.0)
  }

  @Test
  fun `should support nullable values`() {
    val convertedDynamic = convert<Any?>(DynamicFromObject(null))
    val convertedValue = convert<Any?>(null)

    Truth.assertThat(convertedDynamic).isEqualTo(null)
    Truth.assertThat(convertedValue).isEqualTo(null)
  }

  @Test(expected = NullArgumentException::class)
  fun `should throw when null was provided to non-nullable type (Dynamic)`() {
    convert<Any>(DynamicFromObject(null))
  }

  @Test(expected = NullArgumentException::class)
  fun `should throw when null was provided to non-nullable type (Any)`() {
    convert<Any>(null)
  }

  @Test
  fun `should work with collections`() {
    val convertedValue = convert<List<Any>>(listOf(1.0, "string"))
    val convertedDynamic = convert<List<Any>>(
      DynamicFromObject(
        JavaOnlyArray().apply {
          pushDouble(1.0)
          pushString("string")
        }
      )
    )

    Truth.assertThat(convertedValue[0]).isInstanceOf(java.lang.Double::class.java)
    Truth.assertThat(convertedDynamic[0]).isInstanceOf(java.lang.Double::class.java)

    Truth.assertThat(convertedValue[1]).isInstanceOf(String::class.java)
    Truth.assertThat(convertedDynamic[1]).isInstanceOf(String::class.java)

    Truth.assertThat(convertedValue[0] as Double).isEqualTo(1.0)
    Truth.assertThat(convertedValue[0] as Double).isEqualTo(1.0)

    Truth.assertThat(convertedValue[1] as String).isEqualTo("string")
    Truth.assertThat(convertedValue[1] as String).isEqualTo("string")
  }
}
