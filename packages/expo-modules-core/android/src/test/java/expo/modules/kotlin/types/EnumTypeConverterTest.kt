@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.google.common.truth.Truth
import org.junit.Test
import kotlin.reflect.typeOf

class EnumTypeConverterTest {
  private val converter = EnumTypeConverter()

  enum class EnumWithoutParameter {
    VALUE1, VALUE2, VALUE3
  }

  enum class EnumWithInt(val value: Int) {
    VALUE1(1), VALUE2(2), VALUE3(3)
  }

  enum class EnumWithString(val value: String) {
    VALUE1("value1"), VALUE2("value2"), VALUE3("value3")
  }

  @Test
  fun `should convert string to enum without parameter`() {
    val v1 = DynamicFromObject("VALUE1")
    val v2 = DynamicFromObject("VALUE2")
    val v3 = DynamicFromObject("VALUE3")
    val enumType = KClassTypeWrapper(typeOf<EnumWithoutParameter>())

    Truth.assertThat(converter.convert(v1, enumType)).isSameInstanceAs(EnumWithoutParameter.VALUE1)
    Truth.assertThat(converter.convert(v2, enumType)).isSameInstanceAs(EnumWithoutParameter.VALUE2)
    Truth.assertThat(converter.convert(v3, enumType)).isSameInstanceAs(EnumWithoutParameter.VALUE3)
  }

  @Test
  fun `should convert string to enum with int parameter`() {
    val v1 = DynamicFromObject(1.0)
    val v2 = DynamicFromObject(2.0)
    val v3 = DynamicFromObject(3.0)
    val enumType = KClassTypeWrapper(typeOf<EnumWithInt>())

    Truth.assertThat(converter.convert(v1, enumType)).isSameInstanceAs(EnumWithInt.VALUE1)
    Truth.assertThat(converter.convert(v2, enumType)).isSameInstanceAs(EnumWithInt.VALUE2)
    Truth.assertThat(converter.convert(v3, enumType)).isSameInstanceAs(EnumWithInt.VALUE3)
  }

  @Test
  fun `should convert string to enum with string parameter`() {
    val v1 = DynamicFromObject("value1")
    val v2 = DynamicFromObject("value2")
    val v3 = DynamicFromObject("value3")
    val enumType = KClassTypeWrapper(typeOf<EnumWithString>())

    Truth.assertThat(converter.convert(v1, enumType)).isSameInstanceAs(EnumWithString.VALUE1)
    Truth.assertThat(converter.convert(v2, enumType)).isSameInstanceAs(EnumWithString.VALUE2)
    Truth.assertThat(converter.convert(v3, enumType)).isSameInstanceAs(EnumWithString.VALUE3)
  }
}
