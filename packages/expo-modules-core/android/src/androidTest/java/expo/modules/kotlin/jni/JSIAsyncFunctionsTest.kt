@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Assert
import org.junit.Test

class JSIAsyncFunctionsTest {
  enum class SimpleEnumClass {
    V1, V2
  }

  enum class StringEnumClass(val value: String) {
    K1("V1"), K2("V2")
  }

  enum class IntEnumClass(val value: Int) {
    K1(1), K2(2)
  }

  @Test
  fun primitive_arguments_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("stringF") { a: String -> a }
      AsyncFunction("intF") { a: Int -> a }
      AsyncFunction("doubleF") { a: Double -> a }
      AsyncFunction("floatF") { a: Float -> a }
      AsyncFunction("boolF") { a: Boolean -> a }
    }
  ) { methodQueue ->
    val stringValue = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.stringF('expo')").getString()
    val intValue = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.intF(123)").getDouble().toInt()
    val doubleValue = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.doubleF(123.3)").getDouble()
    val floatValue = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.floatF(123.3)").getDouble().toFloat()
    val boolValue = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.boolF(true)").getBool()

    Truth.assertThat(stringValue).isEqualTo("expo")
    Truth.assertThat(intValue).isEqualTo(123)
    Truth.assertThat(doubleValue).isEqualTo(123.3)
    Truth.assertThat(floatValue).isEqualTo(123.3.toFloat())
    Truth.assertThat(boolValue).isEqualTo(true)
  }

  @Test
  fun simple_list_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("listF") { a: List<String> -> a }
    }
  ) { methodQueue ->
    val value = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.listF(['expo', 'is', 'awesome'])").getArray()
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
      AsyncFunction("listF") { a: List<List<Int>> -> a }
    }
  ) { methodQueue ->
    val value = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.listF([[1,2,3], [4,5,6]])").getArray()
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
  fun map_should_be_convertible() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("mapF") { a: Map<String, String> -> a }
    }
  ) { methodQueue ->
    val value = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.mapF({ 'k1': 'v1', 'k2': 'v2' })").getObject()
    val k1 = value.getProperty("k1").getString()
    val k2 = value.getProperty("k2").getString()

    Truth.assertThat(k1).isEqualTo("v1")
    Truth.assertThat(k2).isEqualTo("v2")
  }

  @Test
  fun enums_should_be_obtainable_as_function_argument() {
    var f1WasCalled = false
    var f2WasCalled = false
    var f3WasCalled = false

    withJSIInterop(
      inlineModule {
        Name("TestModule")
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
      }
    ) { methodQueue ->
      waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.f1('V2')")
      waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.f2('V2')")
      waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.f3(2)")
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
      val result = waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.f({ 'x': 123, 's': 'expo' })").getObject()

      val x = result.getProperty("x").getDouble().toInt()
      val s = result.getProperty("s").getString()

      Truth.assertThat(x).isEqualTo(123)
      Truth.assertThat(s).isEqualTo("expo")
    }
  }

  @Test
  fun coded_error_should_be_converted() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("f") { ->
        throw CodedException("Code", "Message")
      }
    }
  ) { methodQueue ->
    val exception = Assert.assertThrows(PromiseException::class.java) {
      waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.f()")
    }

    Truth.assertThat(exception.code).isEqualTo("Code")
    Truth.assertThat(exception.message).contains("Message")
  }

  @Test
  fun arbitrary_error_should_be_converted() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      AsyncFunction("f") { ->
        throw IllegalStateException()
      }
    }
  ) { methodQueue ->
    val exception = Assert.assertThrows(PromiseException::class.java) {
      waitForAsyncFunction(methodQueue, "ExpoModules.TestModule.f()")
    }

    Truth.assertThat(exception.code).isEqualTo("ERR_UNEXPECTED")
    Truth.assertThat(exception.message).contains("java.lang.IllegalStateException")
  }
}
