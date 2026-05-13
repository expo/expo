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

  private fun getLanguageISO(locale: Locale) =
    try {
      languageISOCodes[locale.isO3Language]?.language
    } catch (_: MissingResourceException) {
      null
    } ?: locale.language

  private fun getCountryISO(locale: Locale) =
    try {
      locale.isO3Country.takeIf { it.isNotEmpty() }?.let { countryISOCodes[it]?.country }
    } catch (_: MissingResourceException) {
      null
    } ?: locale.country

  fun getISOCode(locale: Locale): String {
    val language = getLanguageISO(locale)
    val country = getCountryISO(locale)
    return if (country.isNotEmpty()) "$language-$country" else language
  }
}
