package expo.modules.localization

import android.content.Context
import android.icu.util.LocaleData
import android.icu.util.ULocale
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES
import android.text.TextUtils.getLayoutDirectionFromLocale
import android.text.format.DateFormat
import android.util.LayoutDirection
import android.util.Log
import androidx.core.content.edit
import androidx.core.os.LocaleListCompat
import com.facebook.react.modules.i18nmanager.I18nUtil
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.text.DecimalFormatSymbols
import java.util.*

private const val LOCALE_SETTINGS_CHANGED = "onLocaleSettingsChanged"
private const val CALENDAR_SETTINGS_CHANGED = "onCalendarSettingsChanged"
private const val RTL_PREFERENCES = "expo.modules.localization.RTLPreferences"
private const val SUPPORTS_RTL_FROM_CONFIG = "supportsRTLFromConfig"
private const val FORCES_RTL_FROM_CONFIG = "forcesRTLFromConfig"

class LocalizationModule : Module() {
  private var observer: () -> Unit = {}

  override fun definition() = ModuleDefinition {
    Name("ExpoLocalization")

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
    // The config plugin writes a string resource only for a non-default value, so "unset" (parsed as null)
    // means either "not configured" or "no longer configured". We remember which values came from the config
    // to tell the two apart, instead of writing the defaults on every launch and overwriting the app's own
    // I18nManager.allowRTL / forceRTL calls.
    val supportsRTL = context.getString(R.string.ExpoLocalization_supportsRTL).toBooleanStrictOrNull()
    val forcesRTL = context.getString(R.string.ExpoLocalization_forcesRTL).toBooleanStrictOrNull()

    // We call these methods before React loads to ensure it gets rendered correctly the first time the app is opened.
    resolveRTLPreference(context, SUPPORTS_RTL_FROM_CONFIG, supportsRTL, defaultValue = true)?.let {
      I18nUtil.instance.allowRTL(context, it)
    }
    resolveRTLPreference(context, FORCES_RTL_FROM_CONFIG, forcesRTL, defaultValue = false)?.let {
      I18nUtil.instance.forceRTL(context, it)
    }
  }

  /**
   * The value to write for an RTL preference, or null to leave the stored preference alone. Whether the
   * value came from the app config is recorded, so that dropping the option restores the React Native
   * default exactly once, on the first launch without it.
   */
  private fun resolveRTLPreference(
    context: Context,
    fromConfigKey: String,
    configValue: Boolean?,
    defaultValue: Boolean
  ): Boolean? {
    val preferences = context.getSharedPreferences(RTL_PREFERENCES, Context.MODE_PRIVATE)
    val wasFromConfig = preferences.getBoolean(fromConfigKey, false)

    if (wasFromConfig != (configValue != null)) {
      preferences.edit {
        if (configValue != null) {
          putBoolean(fromConfigKey, true)
        } else {
          remove(fromConfigKey)
        }
      }
    }

    return configValue ?: defaultValue.takeIf { wasFromConfig }
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
            "textDirection" to if (getLayoutDirectionFromLocale(locale) == LayoutDirection.RTL) {
              "rtl"
            } else {
              "ltr"
            },
            "languageCode" to locale.language,
            "languageScriptCode" to locale.script.ifEmpty { null },
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
    if (appContext.reactContext == null) {
      return false
    }
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
        "uses24hourClock" to uses24HourClock(), // we ideally would use hourCycle (one of h12, h23, h11, h24) instead, but not sure how to get it on android
        "firstWeekday" to Calendar.getInstance().firstDayOfWeek,
        "timeZone" to Calendar.getInstance().timeZone.id
      )
    )
  }
}
