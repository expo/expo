@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules

import com.google.common.truth.Truth
import expo.modules.kotlin.jni.inlineModule
import expo.modules.kotlin.jni.waitForAsyncFunction
import expo.modules.kotlin.jni.withJSIInterop
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

class JavaScriptViewModule {
  @Test
  fun should_export_view_prototype() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      View(android.view.View::class) {
        AsyncFunction("viewFunction") { viewTag: Int -> }
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
}
