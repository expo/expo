package expo.modules.kotlin.types

import com.google.common.truth.Truth
import org.junit.Test

class EnumSerializerTest {
  enum class EnumWithoutParameter : Enumerable {
    VALUE1, VALUE2, VALUE3
  }

  enum class EnumWithInt(val value: Int) : Enumerable {
    VALUE1(1), VALUE2(2), VALUE3(3)
  }

  enum class EnumWithString(val value: String) : Enumerable {
    VALUE1("value1"), VALUE2("value2"), VALUE3("value3")
  }

  enum class IncompatibleEnum(val v1: String, val v2: String) : Enumerable {
    SOME_VALUE("hello", "world")
  }

  @Test
  fun `should convert enum without parameter to string`() {
    val v1 = EnumWithoutParameter.VALUE1
    val v2 = EnumWithoutParameter.VALUE2
    val v3 = EnumWithoutParameter.VALUE3

    Truth.assertThat(v1.toJSValue()).isEqualTo("VALUE1")
    Truth.assertThat(v2.toJSValue()).isEqualTo("VALUE2")
    Truth.assertThat(v3.toJSValue()).isEqualTo("VALUE3")
  }

  @Test
  fun `should convert enum with int parameter to int`() {
    val v1 = EnumWithInt.VALUE1
    val v2 = EnumWithInt.VALUE2
    val v3 = EnumWithInt.VALUE3

    Truth.assertThat(v1.toJSValue()).isEqualTo(1)
    Truth.assertThat(v2.toJSValue()).isEqualTo(2)
    Truth.assertThat(v3.toJSValue()).isEqualTo(3)
  }

  @Test
  fun `should convert enum with string parameter to string`() {
    val v1 = EnumWithString.VALUE1
    val v2 = EnumWithString.VALUE2
    val v3 = EnumWithString.VALUE3

    Truth.assertThat(v1.toJSValue()).isEqualTo("value1")
    Truth.assertThat(v2.toJSValue()).isEqualTo("value2")
    Truth.assertThat(v3.toJSValue()).isEqualTo("value3")
  }

  @Test(expected = IllegalStateException::class)
  fun `should throw when enum is incompatible with JS`() {
    IncompatibleEnum.SOME_VALUE.toJSValue()
  }
}
