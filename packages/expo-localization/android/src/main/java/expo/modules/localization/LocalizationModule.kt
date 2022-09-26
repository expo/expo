package expo.modules.localization

import android.icu.util.LocaleData
import android.icu.util.ULocale
import android.os.Bundle
import android.view.View
import android.text.TextUtils
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES
import android.text.TextUtils.getLayoutDirectionFromLocale
import android.text.format.DateFormat
import android.util.LayoutDirection
import androidx.core.os.LocaleListCompat
import androidx.core.os.bundleOf

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import kotlin.collections.ArrayList
import java.text.DecimalFormatSymbols
import java.util.*

class LocalizationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoLocalization")

    Constants {
      bundledConstants.toShallowMap()
    }

    AsyncFunction("getLocalizationAsync") {
      return@AsyncFunction bundledConstants
    }

    Function("getLocales") {
      return@Function getLocales()
    }

    Function("getCalendars") {
      return@Function getCalendars()
    }
  }

  // TODO: Bacon: add set language
  private val bundledConstants: Bundle
    get() {
      val locale = Locale.getDefault()
      val localeNames = getLocaleNames(locales)
      val isRTL = TextUtils.getLayoutDirectionFromLocale(locale) == View.LAYOUT_DIRECTION_RTL
      val region = getRegionCode(locale)
      val symbols = DecimalFormatSymbols(locale)
      return bundleOf(
        "currency" to getCurrencyCode(locale),
        "decimalSeparator" to symbols.decimalSeparator.toString(),
        "digitGroupingSeparator" to symbols.groupingSeparator.toString(),
        "isoCurrencyCodes" to ISOCurrencyCodes,
        "isMetric" to !USES_IMPERIAL.contains(region),
        "isRTL" to isRTL,
        // TODO: (barthap) this can throw IndexOutOfBounds exception - handle this properly
        "locale" to localeNames[0],
        "locales" to localeNames,
        "region" to region,
        "timezone" to TimeZone.getDefault().id
      )
    }

  private val locales: List<Locale>
    get() {
      val context = appContext.reactContext ?: return emptyList()
      val configuration = context.resources.configuration
      return if (VERSION.SDK_INT > VERSION_CODES.N) {
        val locales = ArrayList<Locale>()
        for (i in 0 until configuration.locales.size()) {
          locales.add(configuration.locales[i])
        }
        locales
      } else {
        listOf(configuration.locale)
      }
    }

  private fun getRegionCode(locale: Locale): String? {
    val miuiRegion = getSystemProperty("ro.miui.region")
    return if (!TextUtils.isEmpty(miuiRegion)) {
      miuiRegion
    } else {
      getCountryCode(locale)
    }
  }

  private fun getMeasurementSystem(locale: Locale): String? {
    return if (VERSION.SDK_INT >= VERSION_CODES.P) {
      when (LocaleData.getMeasurementSystem(ULocale.forLocale(locale))) {
        LocaleData.MeasurementSystem.SI -> "metric"
        LocaleData.MeasurementSystem.UK -> "uk"
        LocaleData.MeasurementSystem.US -> "us"
        else -> "metric"
      }
    } else {
      if (getRegionCode(locale).equals("uk")) "uk"
      else if (USES_IMPERIAL.contains(getRegionCode(locale))) "us"
      else "metric"
    }
  }

  private fun getLocales(): List<Map<String, Any?>> {
    val locales = mutableListOf<Map<String, Any?>>()
    val localeList: LocaleListCompat = LocaleListCompat.getDefault()
    for (i in 0 until localeList.size()) {
      val locale: Locale = localeList.get(i)
      val decimalFormat = DecimalFormatSymbols.getInstance(locale)
      locales.add(
        mapOf(
          "languageTag" to locale.toLanguageTag(),
          "regionCode" to getRegionCode(locale),
          "textDirection" to if (getLayoutDirectionFromLocale(locale) == LayoutDirection.RTL) "rtl" else "ltr",
          "languageCode" to locale.language,

          // the following two properties should be deprecated once Intl makes it way to RN, instead use toLocaleString
          "decimalSeparator" to decimalFormat.decimalSeparator.toString(),
          "digitGroupingSeparator" to decimalFormat.groupingSeparator.toString(),

          "measurementSystem" to getMeasurementSystem(locale),
          "currencyCode" to decimalFormat.currency.currencyCode,

          // currency symbol can be localized to display locale (1st on the list) or to the locale for the currency (as done here).
          "currencySymbol" to Currency.getInstance(locale).getSymbol(locale),
        )
      )
    }
    return locales
  }

  private fun uses24HourClock(): Boolean {
    if (appContext.reactContext == null) return false
    return DateFormat.is24HourFormat(appContext.reactContext)
  }

  private fun getCalendarType(): String {
    return if (VERSION.SDK_INT >= VERSION_CODES.O) {
      Calendar.getInstance().calendarType.toString()
    } else {
      "gregory"
    }
  }

  private fun getCalendars(): List<Map<String, Any?>> {
    return listOf(
      mapOf(
        "calendar" to getCalendarType(),
        "uses24hourClock" to uses24HourClock(), // we ideally would use hourCycle (one of h12, h23, h11, h24) instead, but not sure how to get it on android and ios
        "firstWeekday" to Calendar.getInstance().firstDayOfWeek,
        "timeZone" to Calendar.getInstance().timeZone.id
      )
    )
  }
}

/**
 * Creates a shallow [Map] from the [Bundle]. Does not traverse nested arrays and bundles.
 */
private fun Bundle.toShallowMap(): Map<String, Any?> {
  val map = HashMap<String, Any?>()
  for (key in this.keySet()) {
    map[key] = this[key]
  }
  return map
}
