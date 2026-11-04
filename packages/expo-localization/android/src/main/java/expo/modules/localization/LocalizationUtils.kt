package expo.modules.localization

import android.icu.util.LocaleData
import android.icu.util.ULocale
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES
import android.text.TextUtils
import java.util.*

val USES_IMPERIAL = listOf("US", "LR", "MM")

// https://wisevoter.com/country-rankings/countries-that-use-fahrenheit/
val USES_FAHRENHEIT = listOf("AG", "BZ", "VG", "FM", "MH", "MS", "KN", "BS", "CY", "TC", "US", "LR", "PW", "KY")

fun getCountryCode(locale: Locale): String? {
  return runCatching {
    val country = locale.country
    if (TextUtils.isEmpty(country)) {
      null
    } else {
      country
    }
  }.getOrNull()
}

fun getSystemProperty(key: String): String {
  return runCatching {
    val systemProperties = Class.forName("android.os.SystemProperties")
    val get = systemProperties.getMethod("get", String::class.java)
    get.invoke(systemProperties, key) as String
  }.getOrNull() ?: ""
}

fun getRegionCode(locale: Locale): String? {
  val miuiRegion = getSystemProperty("ro.miui.region")
  return miuiRegion.ifEmpty {
    getCountryCode(locale)
  }
}

fun getMeasurementSystem(locale: Locale): String? {
  // Android stores the "Measurement system" regional preference as the `ms` keyword. ICU reads only the region.
  when (locale.getUnicodeLocaleType("ms")) {
    "metric" -> return "metric"
    "uksystem" -> return "uk"
    "ussystem" -> return "us"
  }
  return if (VERSION.SDK_INT >= VERSION_CODES.P) {
    when (LocaleData.getMeasurementSystem(ULocale.forLocale(locale))) {
      LocaleData.MeasurementSystem.SI -> "metric"
      LocaleData.MeasurementSystem.UK -> "uk"
      LocaleData.MeasurementSystem.US -> "us"
      else -> "metric"
    }
  } else {
    if (getRegionCode(locale).equals("uk")) {
      "uk"
    } else if (USES_IMPERIAL.contains(getRegionCode(locale))) {
      "us"
    } else {
      "metric"
    }
  }
}

fun getTemperatureUnit(locale: Locale): String? {
  when (locale.getUnicodeLocaleType("mu")) {
    "celsius" -> return "celsius"
    // BCP 47 limits a keyword value to 8 characters.
    "fahrenhe" -> return "fahrenheit"
  }
  val countryCode = getRegionCode(locale) ?: return null
  return if (USES_FAHRENHEIT.contains(countryCode)) {
    "fahrenheit"
  } else {
    "celsius"
  }
}
