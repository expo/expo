package expo.modules.localization

import android.content.Context
import android.icu.util.LocaleData
import android.icu.util.ULocale
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES
import android.os.Bundle
import android.text.TextUtils
import android.text.TextUtils.getLayoutDirectionFromLocale
import android.text.format.DateFormat
import android.util.LayoutDirection
import android.util.Log
import android.view.View
import androidx.core.os.LocaleListCompat
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.text.DecimalFormatSymbols
import java.util.*

// must be kept in sync with https://github.com/facebook/react-native/blob/main/ReactAndroid/src/main/java/com/facebook/react/modules/i18nmanager/I18nUtil.java
private const val SHARED_PREFS_NAME = "com.facebook.react.modules.i18nmanager.I18nUtil"
private const val KEY_FOR_PREFS_ALLOWRTL = "RCTI18nUtil_allowRTL"
private const val KEY_FOR_PREFS_FORCERTL = "RCTI18nUtil_forceRTL"
private const val LOCALE_SETTINGS_CHANGED = "onLocaleSettingsChanged"
private const val CALENDAR_SETTINGS_CHANGED = "onCalendarSettingsChanged"

class LocalizationModule : Module() {
  private var observer: () -> Unit = {}

  override fun definition() = ModuleDefinition {
    Name("ExpoLocalization")

    Constants {
      bundledConstants.toShallowMap()
    }

    AsyncFunction<Bundle>("getLocalizationAsync") {
      return@AsyncFunction bundledConstants
    }

    Function("getLocales") {
      return@Function getPreferredLocales()
    }

    Function("getCalendars") {
      return@Function getCalendars()
    }

    Events(LOCALE_SETTINGS_CHANGED, CALENDAR_SETTINGS_CHANGED)

    OnCreate {
      appContext.reactContext?.let {
        setRTLFromStringResources(it)
      }
      observer = {
        this@LocalizationModule.sendEvent(LOCALE_SETTINGS_CHANGED)
        this@LocalizationModule.sendEvent(CALENDAR_SETTINGS_CHANGED)
      }
      Notifier.registerObserver(observer)
    }

    OnDestroy {
      Notifier.deregisterObserver(observer)
    }
  }

  private fun setRTLFromStringResources(context: Context) {
    // These keys are used by React Native here: https://github.com/facebook/react-native/blob/main/React/Modules/RCTI18nUtil.m
    // We set them before React loads to ensure it gets rendered correctly the first time the app is opened.
    val supportsRTL = appContext.reactContext?.getString(R.string.ExpoLocalization_supportsRTL)
    val forcesRTL = appContext.reactContext?.getString(R.string.ExpoLocalization_forcesRTL)

    if (forcesRTL == "true") {
      context
        .getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .also {
          it.putBoolean(KEY_FOR_PREFS_ALLOWRTL, true)
          it.putBoolean(KEY_FOR_PREFS_FORCERTL, true)
          it.apply()
        }
    } else {
      if (supportsRTL == "true" || supportsRTL == "false") {
        context
          .getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
          .edit()
          .also {
            it.putBoolean(KEY_FOR_PREFS_ALLOWRTL, supportsRTL == "true")
            if (forcesRTL == "false") {
              it.putBoolean(KEY_FOR_PREFS_FORCERTL, false)
            }
            it.apply()
          }
      }
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
        @Suppress("DEPRECATION")
        listOf(configuration.locale)
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
      if (getRegionCode(locale).equals("uk")) {
        "uk"
      } else if (USES_IMPERIAL.contains(getRegionCode(locale))) {
        "us"
      } else {
        "metric"
      }
    }
  }

  private fun getCurrencyProperties(locale: Locale): Map<String, Any?> {
    return try {
      mapOf(
        // Android (except MIUI) has no separate region selection, so `languageCurrencyCode` and `languageCurrencySymbol` are the same as `currencyCode` and `currencySymbol`, and both are specific to the current locale in the list.
        "currencyCode" to Currency.getInstance(locale).currencyCode,
        "currencySymbol" to Currency.getInstance(locale).getSymbol(locale),
        "languageCurrencyCode" to Currency.getInstance(locale).currencyCode,
        "languageCurrencySymbol" to Currency.getInstance(locale).getSymbol(locale)
      )
    } catch (e: Exception) {
      mapOf(
        "currencyCode" to null,
        "currencySymbol" to null,
        "languageCurrencyCode" to null,
        "languageCurrencySymbol" to null
      )
    }
  }

  private fun getPreferredLocales(): List<Map<String, Any?>> {
    val locales = mutableListOf<Map<String, Any?>>()
    val localeList: LocaleListCompat = LocaleListCompat.getDefault()
    for (i in 0 until localeList.size()) {
      try {
        val locale: Locale = localeList.get(i) ?: continue
        val decimalFormat = DecimalFormatSymbols.getInstance(locale)
        locales.add(
          mapOf(
            "languageTag" to locale.toLanguageTag(),
            // On Android `regionCode` is the same as `countryCode`, except for miui where there's an additional region picker.
            "regionCode" to getRegionCode(locale),
            "languageRegionCode" to getCountryCode(locale),
            "textDirection" to if (getLayoutDirectionFromLocale(locale) == LayoutDirection.RTL) "rtl" else "ltr",
            "languageCode" to locale.language,
            // the following two properties should be deprecated once Intl makes it way to RN, instead use toLocaleString
            "decimalSeparator" to decimalFormat.decimalSeparator.toString(),
            "digitGroupingSeparator" to decimalFormat.groupingSeparator.toString(),

            "measurementSystem" to getMeasurementSystem(locale),
            "temperatureUnit" to getTemperatureUnit(locale)
          ) + getCurrencyProperties(locale)
        )
      } catch (e: Exception) {
        // warn about the problematic locale
        // we don't append the problematic locale to the list
        Log.w("expo-localization", "Failed to get locale for index $i", e)
      }
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
