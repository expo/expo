package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import io.mockk.mockk
import org.junit.Assert
import org.junit.Before
import org.junit.Test

class JavaScriptRuntimeTest {
  private lateinit var jsiInterop: JSIInteropModuleRegistry

  @Before
  fun before() {
    jsiInterop = JSIInteropModuleRegistry(mockk()).apply {
      installJSIForTests()
    }
  }

  @Test(expected = JavaScriptEvaluateException::class)
  fun evaluate_should_throw_evaluate_exception() {
    jsiInterop.evaluateScript("'")
  }

  @Test
  fun evaluate_should_throw_evaluate_exception_with_stack() {
    val exception = Assert.assertThrows(JavaScriptEvaluateException::class.java) {
      jsiInterop.evaluateScript("function x() { global.nonExistingFunction(10); }; x();")
    }

    Truth.assertThat(exception.jsStack).isNotEmpty()
  }

  @Test
  fun evaluate_returns_undefined() {
    val undefined = jsiInterop.evaluateScript("undefined")
    Truth.assertThat(undefined.isUndefined()).isTrue()
    Truth.assertThat(undefined.isNull()).isFalse()
    Truth.assertThat(undefined.kind()).isEqualTo("undefined")
  }

  @Test
  fun evaluate_returns_null() {
    val `null` = jsiInterop.evaluateScript("null")
    Truth.assertThat(`null`.isNull()).isTrue()
    Truth.assertThat(`null`.isUndefined()).isFalse()
    Truth.assertThat(`null`.kind()).isEqualTo("null")
  }

  @Test
  fun evaluate_returns_bool() {
    val boolTrue = jsiInterop.evaluateScript("true")
    val boolFalse = jsiInterop.evaluateScript("false")

    Truth.assertThat(boolTrue.isBool()).isTrue()
    Truth.assertThat(boolTrue.kind()).isEqualTo("boolean")

    Truth.assertThat(boolTrue.isBool()).isTrue()
    Truth.assertThat(boolTrue.kind()).isEqualTo("boolean")

    Truth.assertThat(boolTrue.getBool()).isTrue()
    Truth.assertThat(boolFalse.getBool()).isFalse()
  }

  @Test
  fun evaluate_returns_number() {
    val number = jsiInterop.evaluateScript("73.12")
    Truth.assertThat(number.isNumber()).isTrue()
    Truth.assertThat(number.kind()).isEqualTo("number")
    Truth.assertThat(number.getDouble()).isEqualTo(73.12)
  }

  @Test
  fun evaluate_returns_string() {
    val string = jsiInterop.evaluateScript("'foobar'")
    Truth.assertThat(string.isString()).isTrue()
    Truth.assertThat(string.kind()).isEqualTo("string")
    Truth.assertThat(string.getString()).isEqualTo("foobar")
  }

  @Test
  fun evaluate_returns_function() {
    val function = jsiInterop.evaluateScript("(function() {})")
    Truth.assertThat(function.isFunction()).isTrue()
    Truth.assertThat(function.isObject()).isTrue()
    Truth.assertThat(function.kind()).isEqualTo("function")
  }

  @Test
  fun createObject_should_return_a_valid_object() {
    val jsObject = jsiInterop.createObject()

    Truth.assertThat(jsObject.getPropertyNames()).hasLength(0)

    jsObject.setProperty("foo", "bar")
    Truth.assertThat(jsObject.getProperty("foo").getString()).isEqualTo("bar")
  }
}
