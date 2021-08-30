package expo.modules.speech

import java.util.*

// Lazy load the ISO codes into a Map then transform the codes to match other localization patterns in Expo
object LanguageUtils {
  private val countryISOCodes: Map<String, Locale> by lazy {
    Locale.getISOCountries().map { country ->
      val locale = Locale("", country)
      locale.getISO3Country().toUpperCase(locale) to locale
    }.toMap()
  }
  private val languageISOCodes: Map<String, Locale> by lazy {
    Locale.getISOLanguages().map { language ->
      val locale = Locale(language)
      locale.getISO3Language() to locale
    }.toMap()
  }

  // NOTE: These helpers are null-unsafe and should be called ONLY with codes
  // returned by Locale.getISO3Country() and Locale.getISO3Language() respectively
  private fun transformCountryISO(code: String) = countryISOCodes[code]!!.country
  private fun transformLanguageISO(code: String) = languageISOCodes[code]!!.language

  fun getISOCode(locale: Locale): String {
    var language = transformLanguageISO(locale.getISO3Language())
    val country = locale.getISO3Country()
    if (country != "") {
      val countryCode = transformCountryISO(country)
      language += "-$countryCode"
    }
    return language
  }
}
