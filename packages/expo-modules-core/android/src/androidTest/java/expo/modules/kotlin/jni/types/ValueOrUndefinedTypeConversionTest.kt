package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.types.ValueOrUndefined
import org.junit.Test

class ValueOrUndefinedTypeConversionTest {
  @Test
  fun converts_undefined_to_ValueOrUndefined_of_int() = conversionTest<ValueOrUndefined<Int>, Boolean>(
    jsValue = "undefined",
    nativeAssertion = { value: ValueOrUndefined<Int> ->
      Truth.assertThat(value.isUndefined).isTrue()
      Truth.assertThat(value.optional).isNull()
    },
    map = { it.isUndefined },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getBool()).isTrue()
    }
  )

  @Test
  fun converts_number_to_ValueOrUndefined_of_int() = conversionTest<ValueOrUndefined<Int>, Boolean>(
    jsValue = "42",
    nativeAssertion = { value: ValueOrUndefined<Int> ->
      Truth.assertThat(value.isUndefined).isFalse()
      Truth.assertThat(value.optional).isEqualTo(42)
    },
    map = { it.isUndefined },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getBool()).isFalse()
    }
  )

  @Test
  fun converts_null_to_ValueOrUndefined_of_optional_int() = conversionTest<ValueOrUndefined<Int?>, Boolean>(
    jsValue = "null",
    nativeAssertion = { value: ValueOrUndefined<Int?> ->
      Truth.assertThat(value.isUndefined).isFalse()
      Truth.assertThat(value.optional).isNull()
    },
    map = { it.isUndefined },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getBool()).isFalse()
    }
  )

  @Test
  fun converts_undefined_to_ValueOrUndefined_of_optional_int() = conversionTest<ValueOrUndefined<Int?>, Boolean>(
    jsValue = "undefined",
    nativeAssertion = { value: ValueOrUndefined<Int?> ->
      Truth.assertThat(value.isUndefined).isTrue()
      Truth.assertThat(value.optional).isNull()
    },
    map = { it.isUndefined },
    jsAssertion = { jsValue ->
      Truth.assertThat(jsValue.getBool()).isTrue()
    }
  )

  @Test
  fun converts_array_to_list_of_ValueOrUndefined_of_int() = conversionTest<List<ValueOrUndefined<Int>>, List<Boolean>>(
    jsValue = "[1, undefined, 2, undefined, 3]",
    map = { it.map { value -> value.isUndefined } },
    jsAssertion = { jsValue ->
      val parsed = jsValue.getArray().map { it.getBool() }
      Truth.assertThat(parsed).containsExactly(false, true, false, true, false)
    }
  )

  @Test
  fun converts_array_to_list_of_ValueOrUndefined_of_optional_int() = conversionTest<List<ValueOrUndefined<Int?>>, List<Boolean>>(
    jsValue = "[1, undefined, null, 2, undefined, null]",
    map = { it.map { value -> value.isUndefined } },
    nativeAssertion = { value: List<ValueOrUndefined<Int?>> ->
      Truth.assertThat(value[2].isUndefined).isFalse()
      Truth.assertThat(value[2].optional).isNull()

      Truth.assertThat(value[5].isUndefined).isFalse()
      Truth.assertThat(value[5].optional).isNull()
    },
    jsAssertion = { jsValue ->
      val parsed = jsValue.getArray().map { it.getBool() }
      Truth.assertThat(parsed).containsExactly(false, true, false, false, true, false)
    }
  )
}
