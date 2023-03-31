@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Test

internal class JSIPropertiesTest {
  @Test
  fun properties_should_be_present_in_the_getPropertyNames() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Property("p1") { }
      Property("p2")
        .get { }
        .set { _: String -> }
    }
  ) {
    val keys = evaluateScript("Object.keys(expo.modules.TestModule)").getArray()

    Truth.assertThat(keys).hasLength(2)

    val p1 = keys[0].getString()
    val p2 = keys[1].getString()

    Truth.assertThat(p1).isEqualTo("p1")
    Truth.assertThat(p2).isEqualTo("p2")
  }

  @Test
  fun getter_should_be_called() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Property("p1") { return@Property 123 }
      Property("p2").get { return@get 321 }
    }
  ) {
    val p1 = evaluateScript("expo.modules.TestModule.p1").getInt()
    val p2 = evaluateScript("expo.modules.TestModule.p2").getInt()

    Truth.assertThat(p1).isEqualTo(123)
    Truth.assertThat(p2).isEqualTo(321)
  }

  @Test
  fun setter_should_be_called() = withJSIInterop(
    inlineModule {
      var innerValue = 567

      Name("TestModule")
      Property("p")
        .get { innerValue }
        .set { newValue: Int -> innerValue = newValue }
    }
  ) {
    evaluateScript("expo.modules.TestModule.p = 987")
    val p1 = evaluateScript("expo.modules.TestModule.p").getInt()
    evaluateScript("expo.modules.TestModule.p = 123")
    val p2 = evaluateScript("expo.modules.TestModule.p").getInt()

    Truth.assertThat(p1).isEqualTo(987)
    Truth.assertThat(p2).isEqualTo(123)
  }

  @Test
  fun returns_undefined_when_getter_is_not_specified() = withJSIInterop(
    inlineModule {
      Name("TestModule")
      Property("p")
    }
  ) {
    val p = evaluateScript("expo.modules.TestModule.p")
    val undefined = evaluateScript("expo.modules.TestModule.undefined")

    Truth.assertThat(p.isUndefined()).isTrue()
    Truth.assertThat(undefined.isUndefined()).isTrue()
  }
}
