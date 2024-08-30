package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.exception.JavaScriptEvaluateException
import org.junit.Assert
import org.junit.Test

internal class JSIPropertiesTest {
  @Test
  fun properties_should_be_present_in_the_getPropertyNames() = withSingleModule({
    Property("p1") { }
    Property("p2")
      .get { }
      .set { _: String -> }
  }) {
    val keys = evaluateScript("Object.keys($moduleRef)")
      .getArray()
      .map { it.getString() }

    Truth.assertThat(keys.size).isAtLeast(2)

    Truth.assertThat(keys.contains("p1")).isTrue()
    Truth.assertThat(keys.contains("p2")).isTrue()
  }

  @Test
  fun getter_should_be_called() = withSingleModule({
    Property("p1") { return@Property 123 }
    Property("p2").get { return@get 321 }
  }) {
    val p1 = property("p1").getInt()
    val p2 = property("p2").getInt()

    Truth.assertThat(p1).isEqualTo(123)
    Truth.assertThat(p2).isEqualTo(321)
  }

  @Test
  fun setter_should_be_called() = withSingleModule({
    var innerValue = 567
    Property("p")
      .get { innerValue }
      .set { newValue: Int -> innerValue = newValue }
  }) {
    property("p", "987")
    val p1 = property("p").getInt()
    property("p", "123")
    val p2 = property("p").getInt()

    Truth.assertThat(p1).isEqualTo(987)
    Truth.assertThat(p2).isEqualTo(123)
  }

  @Test
  fun returns_undefined_when_getter_is_not_specified() = withSingleModule({
    Property("p")
  }) {
    val p = property("p")
    val undefined = property("undefined")

    Truth.assertThat(p.isUndefined()).isTrue()
    Truth.assertThat(undefined.isUndefined()).isTrue()
  }

  @Test
  fun should_throw_if_setting_a_getter_only_property() = withSingleModule({
    Property("p")
      .get { 567 }
  }) {
    Assert.assertThrows(JavaScriptEvaluateException::class.java) {
      evaluateScript("$moduleRef.p = 1")
    }
    val p1 = property("p").getInt()
    Truth.assertThat(p1).isEqualTo(567)
  }
}
