package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import org.junit.Test

class ListTypeConversionTest {
  @Test
  fun should_cast_single_argument_to_list() = conversionTest<List<Int>, Int>(
    jsValue = "21",
    nativeAssertion = { value: List<Int> ->
      Truth.assertThat(value).hasSize(1)
      Truth.assertThat(value.first()).isEqualTo(21)
    },
    map = { it.first() },
    jsAssertion = JSAssertion.IntEqual(21)
  )

  @Test
  fun should_cast_complex_single_argument_to_list() = conversionTest<List<List<Int>>, Int>(
    jsValue = "[21]",
    nativeAssertion = { value: List<List<Int>> ->
      Truth.assertThat(value).hasSize(1)
      Truth.assertThat(value.first()).hasSize(1)
      Truth.assertThat(value.first().first()).isEqualTo(21)
    },
    map = { it.first().first() },
    jsAssertion = JSAssertion.IntEqual(21)
  )
}
