@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Before
import org.junit.Test

class JavaScriptValueTest {
  private lateinit var jsiInterop: JSIInteropModuleRegistry

  @Before
  fun before() {
    jsiInterop = JSIInteropModuleRegistry(defaultAppContextMock()).apply {
      installJSIForTests()
    }
  }

  @Test
  fun should_wrap_numbers() {
    val numberResult = jsiInterop.evaluateScript("21 + 37")

    Truth.assertThat(numberResult.kind()).isEqualTo("number")
    Truth.assertThat(numberResult.isNumber()).isEqualTo(true)
    Truth.assertThat(numberResult.getDouble().toInt()).isEqualTo(58)
  }

  @Test
  fun should_wrap_strings() {
    val stringResult = jsiInterop.evaluateScript("\"expo is awesome\"")

    Truth.assertThat(stringResult.kind()).isEqualTo("string")
    Truth.assertThat(stringResult.isString()).isEqualTo(true)
    Truth.assertThat(stringResult.getString()).isEqualTo("expo is awesome")
  }

  @Test
  fun should_wrap_booleans() {
    val boolResult = jsiInterop.evaluateScript("true")

    Truth.assertThat(boolResult.kind()).isEqualTo("boolean")
    Truth.assertThat(boolResult.isBool()).isEqualTo(true)
    Truth.assertThat(boolResult.getBool()).isEqualTo(true)
  }

  @Test
  fun should_wrap_objects() {
    val objectResult = jsiInterop.evaluateScript("({\"p1\":123})")

    Truth.assertThat(objectResult.kind()).isEqualTo("object")
    Truth.assertThat(objectResult.isObject()).isEqualTo(true)

    val jsObject = objectResult.getObject()
    Truth.assertThat(jsObject.hasProperty("p1")).isEqualTo(true)

    val p1 = jsObject.getProperty("p1")
    Truth.assertThat(p1.kind()).isEqualTo("number")
    Truth.assertThat(p1.isNumber()).isEqualTo(true)
    Truth.assertThat(p1.getInt()).isEqualTo(123)

    val properties = jsObject.getPropertyNames()
    Truth.assertThat(properties).hasLength(1)
    Truth.assertThat(properties).isEqualTo(arrayOf("p1"))
  }

  @Test
  fun should_be_passed_as_a_reference() {
    var receivedObject: JavaScriptObject? = null
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("f") { jsValue: JavaScriptValue ->
          val jsObject = jsValue.getObject()
          receivedObject = jsObject
          jsObject.setProperty("expo", 123)
        }
      }
    ) {
      val result = evaluateScript(
        """
        const x = {};
        expo.modules.TestModule.f(x);
        x
        """.trimIndent()
      ).getObject()

      Truth.assertThat(result.getProperty("expo").getInt()).isEqualTo(123)
      Truth.assertThat(receivedObject!!.getProperty("expo").getInt()).isEqualTo(123)
    }
  }

  @Test
  fun null_should_be_pass_as_js_value() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("f") { a: JavaScriptValue -> a.isNull() }
    }
  ) {
    val value = evaluateScript("expo.modules.TestModule.f(null)").getBool()
    Truth.assertThat(value).isTrue()
  }
}
