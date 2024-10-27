package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import org.junit.Test

class JavaScriptViewModule {
  @Test
  fun should_export_view_prototype() = withSingleModule({
    View(android.view.View::class) {
      AsyncFunction("viewFunction") { _: Int -> }
      AsyncFunction("anotherViewFunction") { 20 }
    }
  }) {
    val viewFunctions = evaluateScript("Object.getOwnPropertyNames($moduleRef.ViewPrototype)")
      .getArray()
      .map { it.getString() }

    Truth.assertThat(viewFunctions).containsExactly("viewFunction", "anotherViewFunction")
  }

  @Test
  fun view_functions_should_be_callable() = withSingleModule({
    View(android.view.View::class) {
      AsyncFunction("viewFunction") { 123 }
    }
  }) {
    val result = callViewAsync("ViewPrototype", "viewFunction").getInt()
    Truth.assertThat(result).isEqualTo(123)
  }

  @Test
  fun view_functions_should_be_able_to_receives_view_as_argument() = withSingleModule({
    View(android.view.View::class) {
      AsyncFunction("viewFunction") { view: android.view.View ->
        Truth.assertThat(view).isNotNull()
        123
      }
    }
  }) {
    val result = waitForAsyncFunction(
      """
      const nativeView = { nativeTag: 1 };
      Object.assign(nativeView.__proto__, $moduleRef.ViewPrototype);
      nativeView.viewFunction()
      """.trimIndent()
    ).getInt()
    Truth.assertThat(result).isEqualTo(123)
  }
}
