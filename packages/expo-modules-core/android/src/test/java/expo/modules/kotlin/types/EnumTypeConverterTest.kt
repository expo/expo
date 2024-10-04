package expo.modules.kotlin.types

import com.facebook.react.bridge.DynamicFromObject
import com.google.common.truth.Truth
import expo.modules.kotlin.EnumWithInt
import expo.modules.kotlin.EnumWithString
import expo.modules.kotlin.EnumWithoutParameter
import expo.modules.kotlin.exception.EnumNoSuchValueException
import org.junit.Test

class EnumTypeConverterTest {

  @Test
  fun `should convert string to enum without parameter`() {
    val v1 = DynamicFromObject("VALUE1")
    val v2 = DynamicFromObject("VALUE2")
    val v3 = DynamicFromObject("VALUE3")
    val converter = obtainTypeConverter<EnumWithoutParameter>()

    Truth.assertThat(converter.convert(v1)).isSameInstanceAs(EnumWithoutParameter.VALUE1)
    Truth.assertThat(converter.convert(v2)).isSameInstanceAs(EnumWithoutParameter.VALUE2)
    Truth.assertThat(converter.convert(v3)).isSameInstanceAs(EnumWithoutParameter.VALUE3)
  }

  @Test
  fun `should convert string to enum with int parameter`() {
    val v1 = DynamicFromObject(1.0)
    val v2 = DynamicFromObject(2.0)
    val v3 = DynamicFromObject(3.0)
    val converter = obtainTypeConverter<EnumWithInt>()

    Truth.assertThat(converter.convert(v1)).isSameInstanceAs(EnumWithInt.VALUE1)
    Truth.assertThat(converter.convert(v2)).isSameInstanceAs(EnumWithInt.VALUE2)
    Truth.assertThat(converter.convert(v3)).isSameInstanceAs(EnumWithInt.VALUE3)
  }

  @Test
  fun `should convert string to enum with string parameter`() {
    val v1 = DynamicFromObject("value1")
    val v2 = DynamicFromObject("value2")
    val v3 = DynamicFromObject("value3")
    val converter = obtainTypeConverter<EnumWithString>()

    Truth.assertThat(converter.convert(v1)).isSameInstanceAs(EnumWithString.VALUE1)
    Truth.assertThat(converter.convert(v2)).isSameInstanceAs(EnumWithString.VALUE2)
    Truth.assertThat(converter.convert(v3)).isSameInstanceAs(EnumWithString.VALUE3)
  }

  @Test(expected = EnumNoSuchValueException::class)
  fun `should throw when value is invalid`() {
    val value = DynamicFromObject("INVALID")
    val converter = obtainTypeConverter<EnumWithoutParameter>()

    converter.convert(value)
  }
}
