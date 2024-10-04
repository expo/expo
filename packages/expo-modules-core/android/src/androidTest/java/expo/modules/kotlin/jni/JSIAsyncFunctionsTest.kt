@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.extensions.addSingleQuotes
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Assert
import org.junit.Test

class JSIAsyncFunctionsTest {
  enum class SimpleEnumClass : Enumerable {
    V1,
    V2
  }

  enum class StringEnumClass(val value: String) : Enumerable {
    K1("V1"),
    K2("V2")
  }

  enum class IntEnumClass(val value: Int) : Enumerable {
    K1(1),
    K2(2)
  }

  @Test
  fun primitive_arguments_should_be_convertible() = withSingleModule({
    AsyncFunction("stringF") { a: String -> a }
    AsyncFunction("intF") { a: Int -> a }
    AsyncFunction("doubleF") { a: Double -> a }
    AsyncFunction("floatF") { a: Float -> a }
    AsyncFunction("boolF") { a: Boolean -> a }
    AsyncFunction("longF") { a: Long -> a }
  }) {
    val stringValue = callAsync("stringF", "expo".addSingleQuotes()).getString()
    val intValue = callAsync("intF", "123").getInt()
    val doubleValue = callAsync("doubleF", "123.3").getDouble()
    val floatValue = callAsync("floatF", "123.3").getFloat()
    val boolValue = callAsync("boolF", "true").getBool()
    val longValue = callAsync("longF", "21474836470").getDouble().toLong()

    Truth.assertThat(stringValue).isEqualTo("expo")
    Truth.assertThat(intValue).isEqualTo(123)
    Truth.assertThat(doubleValue).isEqualTo(123.3)
    Truth.assertThat(floatValue).isEqualTo(123.3.toFloat())
    Truth.assertThat(boolValue).isEqualTo(true)
    Truth.assertThat(longValue).isEqualTo(21474836470)
  }

  @Test
  fun simple_list_should_be_convertible() = withSingleModule({
    AsyncFunction("listF") { a: List<String> -> a }
  }) {
    val value = callAsync("listF", "['expo', 'is', 'awesome']").getArray()
    Truth.assertThat(value).hasLength(3)
    val e1 = value[0].getString()
    val e2 = value[1].getString()
    val e3 = value[2].getString()
    Truth.assertThat(e1).isEqualTo("expo")
    Truth.assertThat(e2).isEqualTo("is")
    Truth.assertThat(e3).isEqualTo("awesome")
  }

  @Test
  fun complex_list_should_be_convertible() = withSingleModule({
    AsyncFunction("listF") { a: List<List<Int>> -> a }
  }) {
    val value = callAsync("listF", "[[1,2,3], [4,5,6]]").getArray()
    Truth.assertThat(value).hasLength(2)
    val e1 = value[0].getArray()
    val e2 = value[1].getArray()

    Truth.assertThat(e1).hasLength(3)
    Truth.assertThat(e2).hasLength(3)
    val newArray = arrayOf(*e1, *e2)
    newArray.forEachIndexed { index, it ->
      Truth.assertThat(it.getDouble().toInt()).isEqualTo(index + 1)
    }
  }

  @Test
  fun map_should_be_convertible() = withSingleModule({
    AsyncFunction("mapF") { a: Map<String, String> -> a }
  }) {
    val value = callAsync("mapF", "{ 'k1': 'v1', 'k2': 'v2' }").getObject()
    val k1 = value.getProperty("k1").getString()
    val k2 = value.getProperty("k2").getString()

    Truth.assertThat(k1).isEqualTo("v1")
    Truth.assertThat(k2).isEqualTo("v2")
  }

  @Test
  fun set_should_be_convertible() = withSingleModule({
    AsyncFunction("setF") { a: Set<String> -> a }
  }) {
    val value = callAsync("setF", "['s1', 's2', 's1']").getArray()
    Truth.assertThat(value).hasLength(2)

    val mappedValue = value.map { it.getString() }
    Truth.assertThat(mappedValue).containsExactly("s1", "s2")
  }

  @Test
  fun enums_should_be_obtainable_as_function_argument() {
    var f1WasCalled = false
    var f2WasCalled = false
    var f3WasCalled = false

    withSingleModule({
      AsyncFunction("f1") { enum: SimpleEnumClass ->
        f1WasCalled = true
        Truth.assertThat(enum).isEqualTo(SimpleEnumClass.V2)
      }

      AsyncFunction("f2") { enum: StringEnumClass ->
        f2WasCalled = true
        Truth.assertThat(enum).isEqualTo(StringEnumClass.K2)
      }

      AsyncFunction("f3") { enum: IntEnumClass ->
        f3WasCalled = true
        Truth.assertThat(enum).isEqualTo(IntEnumClass.K2)
      }
    }) {
      callAsync("f1", "V2".addSingleQuotes())
      callAsync("f2", "V2".addSingleQuotes())
      callAsync("f3", "2")
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
        AsyncFunction("f") { record: MyRecord ->
          Truth.assertThat(record.x).isEqualTo(123)
          Truth.assertThat(record.s).isEqualTo("expo")
          return@AsyncFunction record
        }
      }
    ) { methodQueue ->
      val result = waitForAsyncFunction(methodQueue, "expo.modules.TestModule.f({ 'x': 123, 's': 'expo' })").getObject()

      val x = result.getProperty("x").getInt()
      val s = result.getProperty("s").getString()

      Truth.assertThat(x).isEqualTo(123)
      Truth.assertThat(s).isEqualTo("expo")
    }
  }

  @Test
  fun coded_error_should_be_converted() = withSingleModule({
    AsyncFunction("f") {
      throw CodedException("Code", "Message", null)
    }
  }) {
    val exception = Assert.assertThrows(PromiseException::class.java) {
      callAsync("f")
    }

    Truth.assertThat(exception.code).isEqualTo("Code")
    Truth.assertThat(exception.message).contains("Message")
  }

  @Test
  fun arbitrary_error_should_be_converted() = withSingleModule({
    AsyncFunction("f") {
      throw IllegalStateException()
    }
  }) {
    val exception = Assert.assertThrows(PromiseException::class.java) {
      callAsync("f")
    }

    Truth.assertThat(exception.code).isEqualTo("ERR_UNEXPECTED")
    Truth.assertThat(exception.message).contains("java.lang.IllegalStateException")
  }

  @Test(expected = PromiseException::class)
  fun should_reject_if_js_value_cannot_be_passed() = withSingleModule({
    AsyncFunction("f") { _: Int -> }
  }) {
    callAsync("f", "Symbol()")
  }

  @Test
  fun int_array_should_be_convertible() = withSingleModule({
    AsyncFunction("intArray") { a: IntArray -> a }
  }) {
    val array = callAsync("intArray", "[1, 2, 3]").getArray()
    Truth.assertThat(array.size).isEqualTo(3)

    val e1 = array[0].getInt()
    val e2 = array[1].getInt()
    val e3 = array[2].getInt()

    Truth.assertThat(e1).isEqualTo(1)
    Truth.assertThat(e2).isEqualTo(2)
    Truth.assertThat(e3).isEqualTo(3)
  }

  @Test
  fun string_array_should_be_convertible() = withSingleModule({
    AsyncFunction("stringArray") { a: Array<String> -> a }
  }) {
    val array = callAsync("stringArray", "['a', 'b', 'c']").getArray()
    Truth.assertThat(array.size).isEqualTo(3)

    val e1 = array[0].getString()
    val e2 = array[1].getString()
    val e3 = array[2].getString()

    Truth.assertThat(e1).isEqualTo("a")
    Truth.assertThat(e2).isEqualTo("b")
    Truth.assertThat(e3).isEqualTo("c")
  }

  @Test
  fun int_array_array_should_be_convertible() = withSingleModule({
    AsyncFunction("array") { a: Array<IntArray> -> a }
  }) {
    val array = callAsync("array", "[[1,2], [3, 4]]").getArray()
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
  fun long_array_should_be_convertible() = withSingleModule({
    AsyncFunction("longArray") { a: LongArray -> a }
  }) {
    val array = callAsync("longArray", "[1, 2, 3]").getArray()
    Truth.assertThat(array.size).isEqualTo(3)

    val e1 = array[0].getDouble()
    val e2 = array[1].getDouble()
    val e3 = array[2].getDouble()

    Truth.assertThat(e1).isEqualTo(1.0)
    Truth.assertThat(e2).isEqualTo(2.0)
    Truth.assertThat(e3).isEqualTo(3.0)
  }

  private class MySharedRef(value: Int, runtimeContext: RuntimeContext) : SharedRef<Int>(value, runtimeContext)

  @Test
  fun shared_ref_should_be_convertible() = withSingleModule({
    AsyncFunction("createRef") {
      MySharedRef(123, module!!.runtimeContext)
    }
    Function("getRef") { ref: MySharedRef ->
      ref.ref
    }
  }) {
    callAsync("createRef").getObject()
    val value = call("getRef", "global.promiseResult").getInt()
    Truth.assertThat(value).isEqualTo(123)
  }
}
