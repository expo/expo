package expo.modules.localization

import android.text.TextUtils
import java.util.*

val USES_IMPERIAL = listOf("US", "LR", "MM")

val ISOCurrencyCodes: Array<String> by lazy {
  Currency.getAvailableCurrencies().map { it.currencyCode as String }.toTypedArray()
}

fun getLocaleNames(locales: List<Locale>) = locales.map { it.toLanguageTag() }.toTypedArray()

fun getCountryCode(locale: Locale): String? {
  return runCatching {
    val country = locale.country
    if (TextUtils.isEmpty(country)) null else country
  }.getOrNull()
}

fun getSystemProperty(key: String): String {
  return runCatching {
    val systemProperties = Class.forName("android.os.SystemProperties")
    val get = systemProperties.getMethod("get", String::class.java)
    get.invoke(systemProperties, key) as String
  }.getOrNull() ?: ""
}

fun getCurrencyCode(locale: Locale): String? {
  return runCatching {
    val currency = Currency.getInstance(locale)
    currency?.currencyCode
  }.getOrNull()
}
