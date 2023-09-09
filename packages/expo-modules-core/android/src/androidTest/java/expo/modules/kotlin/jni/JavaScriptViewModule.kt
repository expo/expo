@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JavaScriptViewModule {
  @Test
  fun should_export_view_prototype() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      View(android.view.View::class) {
        AsyncFunction("viewFunction") { _: Int -> }
        AsyncFunction("anotherViewFunction") { -> 20 }
      }
    }
  ) {
    val viewFunctions = evaluateScript("Object.getOwnPropertyNames(expo.modules.TestModule.ViewPrototype)")
      .getArray()
      .map { it.getString() }

    Truth.assertThat(viewFunctions).containsExactly("viewFunction", "anotherViewFunction")
  }

  @Test
  fun view_functions_should_be_callable() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      View(android.view.View::class) {
        AsyncFunction("viewFunction") { ->
          123
        }
      }
    }
  ) { methodQueue ->
    val result = waitForAsyncFunction(methodQueue, "expo.modules.TestModule.ViewPrototype.viewFunction()").getInt()
    Truth.assertThat(result).isEqualTo(123)
  }

  @Test
  fun view_functions_should_be_able_to_receives_view_as_argument() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      View(android.view.View::class) {
        AsyncFunction("viewFunction") { view: android.view.View ->
          Truth.assertThat(view).isNotNull()
          123
        }
      }
    }
  ) { methodQueue ->
    val result = waitForAsyncFunction(
      methodQueue,
      """
      const nativeView = { nativeTag: 1 };
      Object.assign(nativeView.__proto__, expo.modules.TestModule.ViewPrototype);
      nativeView.viewFunction()
      """.trimIndent()
    ).getInt()
    Truth.assertThat(result).isEqualTo(123)
  }
}
