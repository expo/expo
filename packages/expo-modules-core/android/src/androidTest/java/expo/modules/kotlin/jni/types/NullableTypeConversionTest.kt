package expo.modules.kotlin.jni.types

import com.google.common.truth.Truth
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import org.junit.Test

class NullableTypeConversionTest {
  @Test
  fun should_convert_null_to_different_types() {
    convertFromNullTest<Int>()
    convertFromNullTest<String>()
    convertFromNullTest<List<Int>>()
    convertFromNullTest<List<String>>()
    convertFromNullTest<Map<String, Int>>()
  }

  @Test
  fun should_convert_undefined_to_different_types() {
    convertFromUndefinedTest<Int>()
    convertFromUndefinedTest<String>()
    convertFromUndefinedTest<List<Int>>()
    convertFromUndefinedTest<List<String>>()
    convertFromUndefinedTest<Map<String, Int>>()
  }

  @Test
  fun should_convert_null_to_nullable_parameter_type() {
    conversionTest<List<Int?>>(
      jsValue = "[1, null, 3, null]",
      nativeAssertion = { value: List<Int?> ->
        Truth.assertThat(value.filterNotNull()).containsExactly(1, 3)
        Truth.assertThat(value.filter { it == null }).hasSize(2)
      },
      map = { it },
      jsAssertion = { jsValue ->
        Truth.assertThat(jsValue.isArray()).isTrue()
        val array = jsValue.getArray()

        Truth.assertThat(array.size).isEqualTo(4)

        val e1 = array[0]
        val e2 = array[1]
        val e3 = array[2]
        val e4 = array[3]

        Truth.assertThat(e1.getInt()).isEqualTo(1)
        Truth.assertThat(e2.isNull()).isTrue()
        Truth.assertThat(e3.getInt()).isEqualTo(3)
        Truth.assertThat(e4.isNull()).isTrue()
      }
    )

    conversionTest<Map<String, Int?>>(
      jsValue = "{ a: 1, b: null, c: 3, d: null }",
      nativeAssertion = { value: Map<String, Int?> ->
        Truth.assertThat(value.keys).containsExactly("a", "b", "c", "d")
        Truth.assertThat(value.values).containsExactly(1, null, 3, null)
      },
      map = { it },
      jsAssertion = { jsValue ->
        Truth.assertThat(jsValue.isObject()).isTrue()
        val obj = jsValue.getObject()

        val e1 = obj["a"]!!
        val e2 = obj["b"]!!
        val e3 = obj["c"]!!
        val e4 = obj["d"]!!

        Truth.assertThat(e1.getInt()).isEqualTo(1)
        Truth.assertThat(e2.isNull()).isTrue()
        Truth.assertThat(e3.getInt()).isEqualTo(3)
        Truth.assertThat(e4.isNull()).isTrue()
      }
    )
  }

  @Test
  fun should_convert_null_in_deep_nested_structure() {
    class NestedRecord : Record {
      @Field
      var a: Int? = 10
    }
    class MyRecord : Record {
      @Field
      val nestedRecord: NestedRecord = NestedRecord()
    }

    conversionTest<List<MyRecord>, List<MyRecord>>(
      jsValue = "[{ 'nestedRecord': { 'a': null } }, { 'nestedRecord': { 'a': 20 } }]",
      nativeAssertion = { value: List<MyRecord> ->
        Truth.assertThat(value).hasSize(2)

        val first = value.first()
        val second = value.last()

        Truth.assertThat(first.nestedRecord.a).isNull()
        Truth.assertThat(second.nestedRecord.a).isEqualTo(20)
      },
      map = { it }
    )
  }

  private inline fun <reified NativeType : Any> convertFromNullTest() = conversionTest<NativeType?>(
    jsValue = "null",
    nativeAssertion = { value: Any? ->
      Truth.assertThat(value).isNull()
    },
    jsAssertion = JSAssertion.IsNull()
  )

  private inline fun <reified NativeType : Any> convertFromUndefinedTest() = conversionTest<NativeType?>(
    jsValue = "undefined",
    nativeAssertion = { value: Any? ->
      Truth.assertThat(value).isNull()
    },
    jsAssertion = JSAssertion.IsNull()
  )
}
