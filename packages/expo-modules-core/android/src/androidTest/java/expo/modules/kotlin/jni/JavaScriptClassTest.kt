@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JavaScriptClassTest {
  @Test
  fun has_a_prototype() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Class("MyClass")
    }
  ) {
    val prototype = evaluateScript("expo.modules.TestModule.MyClass.prototype")
    Truth.assertThat(prototype.isObject()).isTrue()
  }

  @Test
  fun has_keys_in_prototype() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Class("MyClass") {
        Function("myFunction") { }
        AsyncFunction("myAsyncFunction") { }
      }
    }
  ) {
    val prototypeKeys = evaluateScript("Object.keys(expo.modules.TestModule.MyClass.prototype)")
      .getArray()
      .map { it.getString() }
    Truth.assertThat(prototypeKeys).containsExactly(
      "myFunction",
      "myAsyncFunction"
    )
  }

  @Test
  fun defines_properties_on_initialization() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Class("MyClass") {
        Property("foo") {
          "bar"
        }
      }
    }
  ) {
    val jsObject = evaluateScript("new expo.modules.TestModule.MyClass()").getObject()
    Truth.assertThat(jsObject.getPropertyNames()).asList().containsExactly("foo")
    Truth.assertThat(jsObject.getProperty("foo").getString()).isEqualTo("bar")
  }
}
