package expo.modules

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.jni.JSIInteropModuleRegistry
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

  @Test
  fun evaluate_should_throw_evaluate_exception() {
    try {
      jsiInterop.evaluateScript("'")
    } catch (e: Throwable) {
      Truth.assertThat(e).isInstanceOf(JavaScriptEvaluateException::class.java)
      return
    }

    Assert.fail("Should throw")
  }

  @Test
  fun evaluate_should_throw_evaluate_exception_with_stack() {
    try {
      jsiInterop.evaluateScript("function x() { console.log(10); }; x();")
    } catch (e: Throwable) {
      Truth.assertThat(e).isInstanceOf(JavaScriptEvaluateException::class.java)
      Truth.assertThat((e as JavaScriptEvaluateException).jsStack).isNotEmpty()
      return
    }

    Assert.fail("Should throw")
  }
}
