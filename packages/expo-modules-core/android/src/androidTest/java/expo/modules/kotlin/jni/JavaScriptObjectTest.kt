package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import io.mockk.mockk
import org.junit.Before
import org.junit.Test

class JavaScriptObjectTest {
  private lateinit var jsiInterop: JSIInteropModuleRegistry

  @Before
  fun before() {
    jsiInterop = JSIInteropModuleRegistry(mockk()).apply {
      installJSIForTests()
    }
  }

  @Test
  fun hasProperty_should_return_false_when_the_property_is_missing() {
    val jsObject = jsiInterop.evaluateScript("({})").getObject()
    Truth.assertThat(jsObject.hasProperty("prop")).isFalse()
  }

  @Test
  fun hasProperty_should_return_true_when_the_property_exists() {
    val jsObject = jsiInterop.evaluateScript("({ 'prop': 123 })").getObject()
    Truth.assertThat(jsObject.hasProperty("prop")).isTrue()
  }

  @Test
  fun getProperty_should_return_correct_value_is_the_property_exists() {
    val jsObject = jsiInterop.evaluateScript("({ 'prop': 123 })").getObject()
    val property = jsObject.getProperty("prop")
    Truth.assertThat(property.isNumber()).isTrue()
    Truth.assertThat(property.getDouble()).isEqualTo(123)
  }


  @Test
  fun getProperty_should_return_undefined_when_the_property_is_missing() {
    val jsObject = jsiInterop.evaluateScript("({ 'prop': 123 })").getObject()
    val property = jsObject.getProperty("foo")
    Truth.assertThat(property.isUndefined()).isTrue()
  }
}
