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
      runCatching { languageISOCodes[locale.isO3Language]?.language }.getOrNull() ?: locale.language

    val country =
      runCatching {
          locale.isO3Country.takeIf { it.isNotEmpty() }?.let { countryISOCodes[it]?.country }
        }
        .getOrNull() ?: locale.country

    return if (country.isNotEmpty()) "$language-$country" else language
  }
}
