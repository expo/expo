package expo.modules.localization

import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.util.Locale

@RunWith(RobolectricTestRunner::class)
class LocalizationUtilsTest {
  @Test
  fun `measurement system follows the ms keyword`() {
    assertEquals("metric", getMeasurementSystem(Locale.forLanguageTag("en-US-u-ms-metric")))
    assertEquals("us", getMeasurementSystem(Locale.forLanguageTag("fr-FR-u-ms-ussystem")))
    assertEquals("uk", getMeasurementSystem(Locale.forLanguageTag("fr-FR-u-ms-uksystem")))
  }

  @Test
  fun `temperature unit follows the mu keyword`() {
    assertEquals("celsius", getTemperatureUnit(Locale.forLanguageTag("en-US-u-mu-celsius")))
    assertEquals("fahrenheit", getTemperatureUnit(Locale.forLanguageTag("fr-FR-u-mu-fahrenhe")))
  }
}
