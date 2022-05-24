package expo.modules

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import expo.modules.kotlin.jni.JSIInteropModuleRegistry
import io.mockk.mockk
import junit.framework.TestCase
import org.junit.Assert
import org.junit.Before
import org.junit.Test

class JavaScriptRuntimeTest : TestCase() {
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
      jsiInterop.evaluateScript("function x() { console.log(10); }; x();")
    }

    Truth.assertThat(exception.jsStack).isNotEmpty()
  }
}
