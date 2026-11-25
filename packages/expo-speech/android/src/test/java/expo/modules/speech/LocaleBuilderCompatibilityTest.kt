package expo.modules.speech

import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Locale

// These tests were added to ensure that the deprecated Locale constructors and the new Locale.Builder produce the same results.
// TODO: Remove these tests after one full release (SDK 59)
class LocaleBuilderCompatibilityTest {
  @Test
  @Suppress("DEPRECATION")
  fun countryBuilderMatchesConstructor() {
    Locale.getISOCountries().forEach { country ->
      assertEquals(Locale("", country), Locale.Builder().setRegion(country).build())
    }
  }

  @Test
  @Suppress("DEPRECATION")
  fun languageBuilderMatchesConstructor() {
    Locale.getISOLanguages().forEach { language ->
      assertEquals(Locale(language), Locale.Builder().setLanguage(language).build())
    }
  }
}
