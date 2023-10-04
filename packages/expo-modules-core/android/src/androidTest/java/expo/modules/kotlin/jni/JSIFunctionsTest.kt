@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.typedarray.Float32Array
import expo.modules.kotlin.typedarray.Int32Array
import expo.modules.kotlin.typedarray.Int8Array
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JSIFunctionsTest {
  enum class SimpleEnumClass : Enumerable {
    V1, V2
  }

  enum class StringEnumClass(val value: String) : Enumerable {
    K1("V1"), K2("V2")
  }

  enum class IntEnumClass(val value: Int) : Enumerable {
    K1(1), K2(2)
  }

  @Test
  fun primitive_arguments_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("stringF") { a: String -> a }
      Function("intF") { a: Int -> a }
      Function("doubleF") { a: Double -> a }
      Function("floatF") { a: Float -> a }
      Function("boolF") { a: Boolean -> a }
      Function("longF") { a: Long -> a }
    }
  ) {
    val stringValue = evaluateScript("expo.modules.TestModule.stringF('expo')").getString()
    val intValue = evaluateScript("expo.modules.TestModule.intF(123)").getInt()
    val doubleValue = evaluateScript("expo.modules.TestModule.doubleF(123.3)").getDouble()
    val floatValue = evaluateScript("expo.modules.TestModule.floatF(123.3)").getFloat()
    val boolValue = evaluateScript("expo.modules.TestModule.boolF(true)").getBool()
    val longValue = evaluateScript("expo.modules.TestModule.longF(21474836470)").getDouble().toLong()

    Truth.assertThat(stringValue).isEqualTo("expo")
    Truth.assertThat(intValue).isEqualTo(123)
    Truth.assertThat(doubleValue).isEqualTo(123.3)
    Truth.assertThat(floatValue).isEqualTo(123.3.toFloat())
    Truth.assertThat(boolValue).isEqualTo(true)
    Truth.assertThat(longValue).isEqualTo(21474836470)
  }

  @Test
  fun simple_list_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("listF") { a: List<String> -> a }
    }
  ) {
    val value = evaluateScript("expo.modules.TestModule.listF(['expo', 'is', 'awesome'])").getArray()
    Truth.assertThat(value).hasLength(3)
    val e1 = value[0].getString()
    val e2 = value[1].getString()
    val e3 = value[2].getString()
    Truth.assertThat(e1).isEqualTo("expo")
    Truth.assertThat(e2).isEqualTo("is")
    Truth.assertThat(e3).isEqualTo("awesome")
  }

  @Test
  fun complex_list_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("listF") { a: List<List<Int>> -> a }
    }
  ) {
    val value = evaluateScript("expo.modules.TestModule.listF([[1,2,3], [4,5,6]])").getArray()
    Truth.assertThat(value).hasLength(2)
    val e1 = value[0].getArray()
    val e2 = value[1].getArray()

    Truth.assertThat(e1).hasLength(3)
    Truth.assertThat(e2).hasLength(3)
    val newArray = arrayOf(*e1, *e2)
    newArray.forEachIndexed { index, element ->
      Truth.assertThat(element.getInt()).isEqualTo(index + 1)
    }
  }

  @Test
  fun enum_list_should_be_convertible() {
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("list") { a: List<SimpleEnumClass> ->
          wasCalled = true

          Truth.assertThat(a).hasSize(2)
          Truth.assertThat(a[0]).isEqualTo(SimpleEnumClass.V1)
          Truth.assertThat(a[1]).isEqualTo(SimpleEnumClass.V2)
        }
      }
    ) {
      evaluateScript("expo.modules.TestModule.list(['V1', 'V2'])")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun js_object_list_should_be_convertible() {
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("list") { a: List<JavaScriptObject> ->
          wasCalled = true

          Truth.assertThat(a).hasSize(2)

          val e1 = a[0]
          val e2 = a[1]

          val foo = e1.getProperty("foo").getString()
          Truth.assertThat(foo).isEqualTo("foo")

          val bar = e2.getProperty("bar").getString()
          Truth.assertThat(bar).isEqualTo("bar")
        }
      }
    ) {
      evaluateScript("expo.modules.TestModule.list([{'foo':'foo'}, {'bar':'bar'}])")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun map_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("mapF") { a: Map<String, String> -> a }
    }
  ) {
    val value = evaluateScript("expo.modules.TestModule.mapF({ 'k1': 'v1', 'k2': 'v2' })").getObject()
    val k1 = value.getProperty("k1").getString()
    val k2 = value.getProperty("k2").getString()

    Truth.assertThat(k1).isEqualTo("v1")
    Truth.assertThat(k2).isEqualTo("v2")
  }

  @Test
  fun js_value_should_be_obtainable_as_function_argument() {
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("f") { jsValue: JavaScriptValue ->
          wasCalled = true
          Truth.assertThat(jsValue.isString()).isTrue()
          Truth.assertThat(jsValue.getString()).isEqualTo("string from js")
        }
      }
    ) {
      evaluateScript("expo.modules.TestModule.f('string from js')")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun js_object_should_be_obtainable_as_function_argument() {
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("f") { jsObject: JavaScriptObject ->
          wasCalled = true
          Truth.assertThat(jsObject.getProperty("k1").getString()).isEqualTo("v1")
        }
      }
    ) {
      evaluateScript("expo.modules.TestModule.f({ 'k1': 'v1' })")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @Test
  fun enums_should_be_obtainable_as_function_argument() {
    var f1WasCalled = false
    var f2WasCalled = false
    var f3WasCalled = false

    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("f1") { enum: SimpleEnumClass ->
          f1WasCalled = true
          Truth.assertThat(enum).isEqualTo(SimpleEnumClass.V2)
        }

        Function("f2") { enum: StringEnumClass ->
          f2WasCalled = true
          Truth.assertThat(enum).isEqualTo(StringEnumClass.K2)
        }

        Function("f3") { enum: IntEnumClass ->
          f3WasCalled = true
          Truth.assertThat(enum).isEqualTo(IntEnumClass.K2)
        }
      }
    ) {
      evaluateScript("expo.modules.TestModule.f1('V2')")
      evaluateScript("expo.modules.TestModule.f2('V2')")
      evaluateScript("expo.modules.TestModule.f3(2)")
      Truth.assertThat(f1WasCalled).isTrue()
      Truth.assertThat(f2WasCalled).isTrue()
      Truth.assertThat(f3WasCalled).isTrue()
    }
  }

  @Test
  fun records_should_be_obtainable_as_function_argument() {
    class MyRecord : Record {
      @Field
      var x: Int = 0

      @Field
      var s: String = ""
    }
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("f") { record: MyRecord ->
          Truth.assertThat(record.x).isEqualTo(123)
          Truth.assertThat(record.s).isEqualTo("expo")
          return@Function record
        }
      }
    ) {
      val result = evaluateScript("expo.modules.TestModule.f({ 'x': 123, 's': 'expo' })").getObject()

      val x = result.getProperty("x").getInt()
      val s = result.getProperty("s").getString()

      Truth.assertThat(x).isEqualTo(123)
      Truth.assertThat(s).isEqualTo("expo")
    }
  }

  @Test
  fun coded_error_should_be_converted() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f") { ->
        throw CodedException("Code", "Message", null)
      }
    }
  ) {
    val exception = evaluateScript(
      """
      let exception = null;
      try {
        expo.modules.TestModule.f()
      } catch (e) {
        if (e instanceof global.ExpoModulesCore_CodedError) {
          exception = e;
        }
      }
      exception
      """.trimIndent()
    ).getObject()

    Truth.assertThat(exception.getProperty("code").getString()).isEqualTo("Code")
    Truth.assertThat(exception.getProperty("message").getString()).contains("Message")
  }

  @Test
  fun arbitrary_error_should_be_converted() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f") { ->
        throw IllegalStateException()
      }
    }
  ) {
    val exception = evaluateScript(
      """
      let exception = null;
      try {
        expo.modules.TestModule.f()
      } catch (e) {
        if (e instanceof global.ExpoModulesCore_CodedError) {
          exception = e;
        }
      }
      exception
      """.trimIndent()
    ).getObject()

    Truth.assertThat(exception.getProperty("code").getString()).isEqualTo("ERR_UNEXPECTED")
    Truth.assertThat(exception.getProperty("message").getString()).contains("java.lang.IllegalStateException")
  }

  @Test(expected = JavaScriptEvaluateException::class)
  fun uncaught_error_should_be_piped_to_host_language() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f") { ->
        throw IllegalStateException()
      }
    }
  ) {
    evaluateScript("expo.modules.TestModule.f()")
  }

  @Test
  fun typed_arrays_should_be_obtainable_as_function_argument() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f") { intArray: Int32Array, floatArray: Float32Array, byteArray: Int8Array ->
        Truth.assertThat(intArray[0]).isEqualTo(1)
        Truth.assertThat(intArray[1]).isEqualTo(2)
        Truth.assertThat(intArray[2]).isEqualTo(3)

        Truth.assertThat(floatArray[0]).isEqualTo(1f)
        Truth.assertThat(floatArray[1]).isEqualTo(2f)
        Truth.assertThat(floatArray[2]).isEqualTo(3f)

        Truth.assertThat(byteArray[0]).isEqualTo(1.toByte())
        Truth.assertThat(byteArray[1]).isEqualTo(2.toByte())
        Truth.assertThat(byteArray[2]).isEqualTo(3.toByte())
      }
    }
  ) {
    evaluateScript("expo.modules.TestModule.f(new Int32Array([1,2,3]), new Float32Array([1.0,2.0,3.0]), new Int8Array([1,2,3]))")
  }

  @Test
  fun typed_arrays_should_be_returnable() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("genericTypedArray") { typedArray: TypedArray ->
        typedArray
      }
      Function("intTypedArray") { typedArray: Int32Array ->
        typedArray
      }
    }
  ) {
    val isArray = evaluateScript("expo.modules.TestModule.genericTypedArray(new Int32Array([1,2,3]))").isTypedArray()
    val isArray2 = evaluateScript("expo.modules.TestModule.intTypedArray(new Int32Array([1,2,3]))").isTypedArray()

    Truth.assertThat(isArray).isTrue()
    Truth.assertThat(isArray2).isTrue()
  }

  @Test
  fun typed_arrays_should_not_copy_content() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f") { intArray: Int32Array ->
        intArray[1] = 999
      }
    }
  ) {
    evaluateScript(
      """
      const typedArray = new Int32Array([1,2,3]);
      expo.modules.TestModule.f(typedArray);
      if (typedArray[0] !== 1 || typedArray[1] !== 999 || typedArray[2] !== 3) {
        throw new Error("Array was copied")
      }
      """.trimIndent()
    )
  }

  @Test(expected = JavaScriptEvaluateException::class)
  fun should_throw_if_js_value_cannot_be_passed() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f") { _: Int -> }
    }
  ) {
    evaluateScript("expo.modules.TestModule.f(Symbol())")
  }

  @Test
  fun int_array_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("intArray") { a: IntArray -> a }
    }
  ) {
    val array = evaluateScript("expo.modules.TestModule.intArray([1, 2, 3])").getArray()
    Truth.assertThat(array.size).isEqualTo(3)

    val e1 = array[0].getInt()
    val e2 = array[1].getInt()
    val e3 = array[2].getInt()

    Truth.assertThat(e1).isEqualTo(1)
    Truth.assertThat(e2).isEqualTo(2)
    Truth.assertThat(e3).isEqualTo(3)
  }

  @Test
  fun string_array_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("stringArray") { a: Array<String> -> a }
    }
  ) {
    val array = evaluateScript("expo.modules.TestModule.stringArray(['a', 'b', 'c'])").getArray()
    Truth.assertThat(array.size).isEqualTo(3)

    val e1 = array[0].getString()
    val e2 = array[1].getString()
    val e3 = array[2].getString()

    Truth.assertThat(e1).isEqualTo("a")
    Truth.assertThat(e2).isEqualTo("b")
    Truth.assertThat(e3).isEqualTo("c")
  }

  @Test
  fun int_array_array_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("array") { a: Array<IntArray> -> a }
    }
  ) {
    val array = evaluateScript("expo.modules.TestModule.array([[1,2], [3, 4]])").getArray()
    Truth.assertThat(array.size).isEqualTo(2)

    val a1 = array[0].getArray()
    val a2 = array[1].getArray()

    Truth.assertThat(a1.size).isEqualTo(2)
    Truth.assertThat(a2.size).isEqualTo(2)

    val e1 = a1[0].getInt()
    val e2 = a1[1].getInt()
    val e3 = a2[0].getInt()
    val e4 = a2[1].getInt()

    Truth.assertThat(e1).isEqualTo(1)
    Truth.assertThat(e2).isEqualTo(2)
    Truth.assertThat(e3).isEqualTo(3)
    Truth.assertThat(e4).isEqualTo(4)
  }

  @Test
  fun js_object_array_should_be_convertible() {
    var wasCalled = false
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("jsObjectArray") { a: Array<JavaScriptObject> ->
          wasCalled = true

          Truth.assertThat(a).hasLength(2)

          val e1 = a[0]
          val e2 = a[1]

          val foo = e1.getProperty("foo").getString()
          Truth.assertThat(foo).isEqualTo("foo")

          val bar = e2.getProperty("bar").getString()
          Truth.assertThat(bar).isEqualTo("bar")
        }
      }
    ) {
      evaluateScript("expo.modules.TestModule.jsObjectArray([{'foo':'foo'}, {'bar':'bar'}])")
      Truth.assertThat(wasCalled).isTrue()
    }
  }

  @OptIn(EitherType::class)
  @Test
  fun either_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("eitherFirst") { either: Either<Int, String> ->
        Truth.assertThat(either.`is`(Int::class)).isTrue()
        either.get(Int::class)
      }
      Function("eitherSecond") { either: Either<Int, String> ->
        Truth.assertThat(either.`is`(String::class)).isTrue()
        either.get(String::class)
      }
    }
  ) {
    val int = evaluateScript("expo.modules.TestModule.eitherFirst(123)").getInt()
    val string = evaluateScript("expo.modules.TestModule.eitherSecond('expo')").getString()

    Truth.assertThat(int).isEqualTo(123)
    Truth.assertThat(string).isEqualTo("expo")
  }

  @Test
  fun allows_to_skip_trailing_optional_arguments() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("test") { a: String, b: Int?, c: Boolean? ->
        Truth.assertThat(a).isEqualTo("abc")
        if (b != null) {
          Truth.assertThat(b).isEqualTo(123)
        }
        if (c != null) {
          Truth.assertThat(c).isTrue()
        }
        return@Function "expo"
      }
      Function("allOptionalArguments") { a: String?, b: Int? ->
        Truth.assertThat(a).isNull()
        Truth.assertThat(b).isNull()
        return@Function "is awesome"
      }
    }
  ) {
    val result1 = evaluateScript("expo.modules.TestModule.test('abc')").getString()
    val result2 = evaluateScript("expo.modules.TestModule.test('abc', 123)").getString()
    val result3 = evaluateScript("expo.modules.TestModule.test('abc', 123, true)").getString()
    val result4 = evaluateScript("expo.modules.TestModule.allOptionalArguments()").getString()

    Truth.assertThat(result1).isEqualTo("expo")
    Truth.assertThat(result2).isEqualTo("expo")
    Truth.assertThat(result3).isEqualTo("expo")
    Truth.assertThat(result4).isEqualTo("is awesome")
  }

  @Test
  fun complex_types_should_be_convertible() {
    @Suppress("EqualsOrHashCode")
    data class InlineRecord(@Field var name: String = "") : Record

    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("list") { listOfRecords: List<InlineRecord> ->
          Truth.assertThat(listOfRecords).contains(InlineRecord("expo"))
          Truth.assertThat(listOfRecords).contains(InlineRecord("is"))
          Truth.assertThat(listOfRecords).contains(InlineRecord("awesome"))
          Truth.assertThat(listOfRecords).hasSize(3)
        }
        Function("map") { mapOfRecords: Map<String, InlineRecord> ->
          Truth.assertThat(mapOfRecords).containsEntry("k1", InlineRecord("k1"))
          Truth.assertThat(mapOfRecords).containsEntry("k2", InlineRecord("k2"))
          Truth.assertThat(mapOfRecords).hasSize(2)
        }
      }
    ) {
      evaluateScript("expo.modules.TestModule.list([{ name: 'expo' }, { name: 'is' }, { name: 'awesome' }])")
      evaluateScript("expo.modules.TestModule.map({ k1: { name: 'k1' }, k2: { name: 'k2' }})")
    }
  }
}
