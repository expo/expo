@file:OptIn(ExperimentalCoroutinesApi::class)

package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import org.junit.Before
import org.junit.Test

class JavaScriptObjectTest {
  private lateinit var jsiInterop: JSIInteropModuleRegistry

  private fun emptyObject(): JavaScriptObject {
    return jsiInterop.evaluateScript("({ })").getObject()
  }

  @Before
  fun before() {
    jsiInterop = JSIInteropModuleRegistry(mockk()).apply {
      installJSIForTests()
    }
  }

  @Test
  fun hasProperty_should_return_false_when_the_property_is_missing() {
    val jsObject = emptyObject()
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

  @Test
  fun setProperty_should_work_with_bool() {
    val jsObject = jsiInterop.evaluateScript("({ })").getObject()
    jsObject.setProperty("foo", true)
    jsObject.setProperty("bar", false)

    val foo = jsObject.getProperty("foo").getBool()
    val bar = jsObject.getProperty("bar").getBool()

    Truth.assertThat(foo).isTrue()
    Truth.assertThat(bar).isFalse()
  }

  @Test
  fun setProperty_should_work_with_int() = with(emptyObject()) {
    setProperty("foo", 123)
    val foo = getProperty("foo").getDouble()
    Truth.assertThat(foo).isEqualTo(123)
  }

  @Test
  fun setProperty_should_work_with_double() = with(emptyObject()) {
    setProperty("foo", 20.43)
    val foo = getProperty("foo").getDouble()
    Truth.assertThat(foo).isEqualTo(20.43)
  }

  @Test
  fun setProperty_should_work_with_string() = with(emptyObject()) {
    setProperty("foo", "bar")
    setProperty("bar", null as String?)

    val foo = getProperty("foo").getString()
    val bar = getProperty("bar")

    Truth.assertThat(foo).isEqualTo("bar")
    Truth.assertThat(bar.isUndefined()).isTrue()
  }

  @Test
  fun setProperty_should_work_with_js_value() = with(emptyObject()) {
    val jsValue = jsiInterop.evaluateScript("123")

    setProperty("foo", jsValue)

    val foo = getProperty("foo").getDouble()

    Truth.assertThat(foo).isEqualTo(123)
  }

  @Test
  fun setProperty_should_work_with_js_object() = with(emptyObject()) {
    val jsObject = jsiInterop.evaluateScript("({ 'bar': 10 })").getObject()

    setProperty("foo", jsObject)

    val foo = getProperty("foo").getObject()
    val bar = foo.getProperty("bar").getDouble()

    Truth.assertThat(bar).isEqualTo(10)
  }

  @Test
  fun setProperty_should_work_with_untyped_null() {
    val jsObject = jsiInterop.evaluateScript("({ 'foo': 10 })").getObject()

    jsObject.setProperty("foo", null)
    val foo = jsObject.getProperty("foo")

    Truth.assertThat(foo.isUndefined()).isTrue()
  }

  @Test
  fun defineProperty_defines_non_enumerable_property() = with(emptyObject()) {
    defineProperty("expo", 10)

    Truth.assertThat(getProperty("expo").getDouble()).isEqualTo(10)
    Truth.assertThat(getPropertyNames().toList()).doesNotContain("expo")
  }

  @Test
  fun defineProperty_defines_enumerable_property() = with(emptyObject()) {
    // When the property is enumerable, it is listed in the property names
    defineProperty("expo", 10, listOf(JavaScriptObject.PropertyDescriptor.Enumerable))

    Truth.assertThat(getProperty("expo").getDouble()).isEqualTo(10)
    Truth.assertThat(getPropertyNames().toList()).contains("expo")
  }

  @Test
  fun defineProperty_defines_configurable_property() = with(emptyObject()) {
    // Configurable allows to redefine the property
    defineProperty("expo", 10, listOf(JavaScriptObject.PropertyDescriptor.Configurable))
    Truth.assertThat(getProperty("expo").getDouble()).isEqualTo(10)

    defineProperty("expo", 123)
    Truth.assertThat(getProperty("expo").getDouble()).isEqualTo(123)
  }

  @Test
  fun defineProperty_defines_writable_property() = with(emptyObject()) {
    // Writable allows changing the property
    defineProperty("expo", 10, listOf(JavaScriptObject.PropertyDescriptor.Writable))
    Truth.assertThat(getProperty("expo").getDouble()).isEqualTo(10)

    setProperty("expo", 123)
    Truth.assertThat(getProperty("expo").getDouble()).isEqualTo(123)
  }

  @Test
  fun should_be_passed_as_a_reference() {
    var receivedObject: JavaScriptObject? = null
    withJSIInterop(
      inlineModule {
        Name("TestModule")
        Function("f") { jsObject: JavaScriptObject ->
          receivedObject = jsObject
          jsObject.setProperty("expo", 123)
        }
      }
    ) {
      val result = evaluateScript(
        """
        const x = {};
        expo.modules.TestModule.f(x);
        x
        """.trimIndent()
      ).getObject()

      Truth.assertThat(result.getProperty("expo").getInt()).isEqualTo(123)
      Truth.assertThat(receivedObject!!.getProperty("expo").getInt()).isEqualTo(123)
    }
  }
}
