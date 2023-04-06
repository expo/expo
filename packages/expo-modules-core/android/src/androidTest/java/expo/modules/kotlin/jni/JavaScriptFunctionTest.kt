@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Before
import org.junit.Test

class JavaScriptFunctionTest {
  private lateinit var jsiInterop: JSIInteropModuleRegistry

  @Before
  fun before() {
    jsiInterop = JSIInteropModuleRegistry(mockk()).apply {
      installJSIForTests()
    }
  }

  @Test
  fun should_be_able_to_receive_function_instance() {
    val jsValue = jsiInterop.evaluateScript("() => {}")
    Truth.assertThat(jsValue.isFunction()).isTrue()
    val jsFunction = jsValue.getFunction()
    Truth.assertThat(jsFunction).isNotNull()
  }

  @Test
  fun should_be_able_to_return_value() {
    val function = jsiInterop.evaluateScript("() => { return 21 }").getFunction<Int>()
    val result = function()
    Truth.assertThat(result).isEqualTo(21)
  }

  @Test
  fun should_be_able_to_accept_simple_data() {
    val function = jsiInterop.evaluateScript("(a, b) => { return a + b }").getFunction<Int>()
    val result = function(20, 50)
    Truth.assertThat(result).isEqualTo(70)
  }

  @Test
  fun should_be_able_to_accept_complex_data() {
    val function = jsiInterop.evaluateScript("(object) => { return object.k1 }").getFunction<String>()
    val result = function(mapOf("k1" to "expo"))
    Truth.assertThat(result).isEqualTo("expo")
  }

  @Test
  fun should_be_accepted_as_a_function_arg() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Function("decorate") { jsFunction: JavaScriptFunction<String> ->
        "${jsFunction()}${jsFunction()}"
      }
    }
  ) {
    val result = evaluateScript("expo.modules.TestModule.decorate(() => 'foo')").getString()
    Truth.assertThat(result).isEqualTo("foofoo")
  }
}
