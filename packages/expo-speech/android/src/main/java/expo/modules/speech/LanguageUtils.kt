package expo.modules.speech

import java.util.*

// Lazy load the ISO codes into a Map then transform the codes to match other localization patterns in Expo
object LanguageUtils {
  private val countryISOCodes: Map<String, Locale> by lazy {
    Locale.getISOCountries().associate { country ->
      val locale = Locale("", country)
      locale.isO3Country.uppercase(locale) to locale
    }
  }
  private val languageISOCodes: Map<String, Locale> by lazy {
    Locale.getISOLanguages().associate { language ->
      val locale = Locale(language)
      locale.isO3Language to locale
    }
  }

  fun getISOCode(locale: Locale): String {
    val language =
      try {
        languageISOCodes[locale.isO3Language]?.language
      } catch (_: MissingResourceException) {
        null
      } ?: locale.language

    val country =
      try {
        locale.isO3Country.takeIf { it != "" }?.let { countryISOCodes[it]?.country }
      } catch (_: MissingResourceException) {
        null
      } ?: locale.country

    return if (country.isNotEmpty()) "$language-$country" else language
  }
}
