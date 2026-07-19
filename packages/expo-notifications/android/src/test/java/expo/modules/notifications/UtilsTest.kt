package expo.modules.notifications

import android.os.Bundle
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class UtilsTest {

  // For unit test, fail the bundle if it contains an Int
  private val testBundleConversionForUnitTest: BundleConversionTester = { bundle: Bundle ->
    var result = true
    bundle.keySet().forEach {
      val value = bundle[it]
      if (value is Int) {
        result = false
      }
    }
    result
  }

  private val validBundle = Bundle().also {
    it.putString("1", "test")
    it.putFloat("2", 2.0f)
  }

  private val bundleWithOneInvalidElement = Bundle().also {
    it.putString("1", "test")
    it.putInt("3", 3) // invalid
  }

  private val bundleWithTwoInvalidElements = bundleWithOneInvalidElement.also {
    it.putFloat("2", 2.0f)
    it.putInt("4", 4) // invalid
  }

  private val bundleWithNestedInvalidBundle = validBundle.also {
    it.putString("1", "test")
    it.putBundle("nested", bundleWithOneInvalidElement)
  }

  @Test
  fun `filteredBundleForJSTypeConverter with empty bundle`() {
    val result = filteredBundleForJSTypeConverter(Bundle(), testBundleConversionForUnitTest)
    assert(result.keySet().size == 0)
  }

  fun `filteredBundleForJSTypeConverter with valid bundle`() {
    val result = filteredBundleForJSTypeConverter(validBundle, testBundleConversionForUnitTest)
    assert(result.keySet().size == validBundle.keySet().size)
  }

  fun `filteredBundleForJSTypeConverter with one invalid element`() {
    val result = filteredBundleForJSTypeConverter(bundleWithOneInvalidElement, testBundleConversionForUnitTest)
    assert(bundleWithOneInvalidElement.keySet().size - result.keySet().size == 1)
  }

  fun `filteredBundleForJSTypeConverter with two invalid elements`() {
    val result = filteredBundleForJSTypeConverter(bundleWithTwoInvalidElements, testBundleConversionForUnitTest)
    assert(bundleWithTwoInvalidElements.keySet().size - result.keySet().size == 2)
  }

  fun `filteredBundleForJSTypeConverter with nested invalid bundle`() {
    val result = filteredBundleForJSTypeConverter(bundleWithNestedInvalidBundle, testBundleConversionForUnitTest)
    assert(bundleWithNestedInvalidBundle.keySet().size - result.keySet().size == 0)
    val nested = result.getBundle("nested") ?: Bundle()
    assert(bundleWithOneInvalidElement.keySet().size - nested.keySet().size == 1)
  }
}
