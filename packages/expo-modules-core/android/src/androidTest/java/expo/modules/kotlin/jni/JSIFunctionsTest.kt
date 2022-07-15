@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JSIFunctionsTest {
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
      Function("stringF") { a: String -> a }
      Function("intF") { a: Int -> a }
      Function("doubleF") { a: Double -> a }
      Function("floatF") { a: Float -> a }
      Function("boolF") { a: Boolean -> a }
    }
  ) {
    val stringValue = evaluateScript("ExpoModules.TestModule.stringF('expo')").getString()
    val intValue = evaluateScript("ExpoModules.TestModule.intF(123)").getDouble().toInt()
    val doubleValue = evaluateScript("ExpoModules.TestModule.doubleF(123.3)").getDouble()
    val floatValue = evaluateScript("ExpoModules.TestModule.floatF(123.3)").getDouble().toFloat()
    val boolValue = evaluateScript("ExpoModules.TestModule.boolF(true)").getBool()

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
      Function("listF") { a: List<String> -> a }
    }
  ) {
    val value = evaluateScript("ExpoModules.TestModule.listF(['expo', 'is', 'awesome'])").getArray()
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
    val value = evaluateScript("ExpoModules.TestModule.listF([[1,2,3], [4,5,6]])").getArray()
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
      Function("mapF") { a: Map<String, String> -> a }
    }
  ) {
    val value = evaluateScript("ExpoModules.TestModule.mapF({ 'k1': 'v1', 'k2': 'v2' })").getObject()
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
      evaluateScript("ExpoModules.TestModule.f('string from js')")
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
      evaluateScript("ExpoModules.TestModule.f({ 'k1': 'v1' })")
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
      evaluateScript("ExpoModules.TestModule.f1('V2')")
      evaluateScript("ExpoModules.TestModule.f2('V2')")
      evaluateScript("ExpoModules.TestModule.f3(2)")
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
      val result = evaluateScript("ExpoModules.TestModule.f({ 'x': 123, 's': 'expo' })").getObject()

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
      Function("f") { ->
        throw CodedException("Code", "Message")
      }
    }
  ) {
    val exception = evaluateScript(
      """
      let exception = null;
      try {
        ExpoModules.TestModule.f()
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
        ExpoModules.TestModule.f()
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
    evaluateScript("ExpoModules.TestModule.f()")
  }
}
