package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.withSingleModule
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleConverters
import expo.modules.kotlin.modules.ModuleDefinition
import org.junit.Test

class CustomTypeConvertersTest {
  class CustomType

  @Test
  fun test() = withSingleModule(object : Module() {
    override fun converters() = ModuleConverters {
      TypeConverter(CustomType::class)
        .from { number: Int ->
          Truth.assertThat(number).isEqualTo(1234)
          CustomType()
        }
        .from { string: String ->
          Truth.assertThat("string").isEqualTo("string")
          CustomType()
        }
        .from { listOfNumber: List<Int> ->
          Truth.assertThat(listOfNumber).isEqualTo(listOf(1, 2, 3))
          CustomType()
        }
        .from { listOfString: List<String> ->
          Truth.assertThat(listOfString).isEqualTo(listOf("a", "b", "c"))
          CustomType()
        }
    }

    override fun definition() = ModuleDefinition {
      Name("TestModule")
      Function("convert") { type: CustomType ->
        Truth.assertThat(type).isInstanceOf(CustomType::class.java)
        true
      }
      Function("convertNullable") { type: CustomType? ->
        Truth.assertThat(type).isNull()
        true
      }
    }
  }) {
    Truth.assertThat(
      call("convert", "1234").getBool()
    ).isTrue()

    Truth.assertThat(
      call("convertNullable", "null")
        .getBool()
    ).isTrue()

    Truth.assertThat(
      call("convert", "'string'").getBool()
    ).isTrue()

    Truth.assertThat(
      call("convert", "[1, 2, 3]").getBool()
    ).isTrue()

    Truth.assertThat(
      call("convert", "['a', 'b', 'c']").getBool()
    ).isTrue()
  }
}
