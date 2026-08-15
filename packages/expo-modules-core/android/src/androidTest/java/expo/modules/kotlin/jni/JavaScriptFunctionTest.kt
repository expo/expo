@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.types.testConverterContext
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JavaScriptFunctionTest {

  @Test
  fun should_be_able_to_receive_function_instance() = withJSIInterop {
    val jsValue = evaluateScript("() => {}")
    Truth.assertThat(jsValue.isFunction()).isTrue()
    val jsFunction = jsValue.getFunction()
    Truth.assertThat(jsFunction).isNotNull()
  }

  @Test
  fun should_be_able_to_return_value() = withJSIInterop {
    val function = evaluateScript("() => { return 21 }").getFunction<Int>()
    val result = function(converterContext = testConverterContext)
    Truth.assertThat(result).isEqualTo(21)
  }

  @Test
  fun should_be_able_to_accept_simple_data() = withJSIInterop {
    val function = evaluateScript("(a, b) => { return a + b }").getFunction<Int>()
    val result = function(20, 50, converterContext = testConverterContext)
    Truth.assertThat(result).isEqualTo(70)
  }

  @Test
  fun should_be_able_to_accept_complex_data() = withJSIInterop {
    val function = evaluateScript("(object) => { return object.k1 }").getFunction<String>()
    val result = function(mapOf("k1" to "expo"), converterContext = testConverterContext)
    Truth.assertThat(result).isEqualTo("expo")
  }

  @Test
  fun should_be_accepted_as_a_function_arg() = withSingleModule({
    Function("decorate") { jsFunction: JavaScriptFunction<String> ->
      "${jsFunction(converterContext = testConverterContext)}${jsFunction(converterContext = testConverterContext)}"
    }
  }) {
    val result = call("decorate", "() => 'foo'").getString()
    Truth.assertThat(result).isEqualTo("foofoo")
  }
}
