package expo.modules.localization

import android.os.Bundle
import android.view.View
import android.text.TextUtils
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import kotlin.collections.ArrayList
import java.text.DecimalFormatSymbols
import java.util.*

class LocalizationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoLocalization")

    Constants {
      bundledConstants.toMap()
    }

    AsyncFunction("getLocalizationAsync") {
      return@AsyncFunction bundledConstants
    }
  }

  // TODO: Bacon: add set language
  private val bundledConstants: Bundle
    get() {
      val locale = Locale.getDefault()
      val locales = locales
      val localeNames = getLocaleNames(locales)
      val isRTL = TextUtils.getLayoutDirectionFromLocale(locale) == View.LAYOUT_DIRECTION_RTL
      val region = getRegionCode(locale)
      val symbols = DecimalFormatSymbols(locale)
      return Bundle().apply {
        putString("currency", getCurrencyCode(locale))
        putString("decimalSeparator", symbols.decimalSeparator.toString())
        putString("digitGroupingSeparator", symbols.groupingSeparator.toString())
        putStringArrayList("isoCurrencyCodes", iSOCurrencyCodes)
        putBoolean("isMetric", !USES_IMPERIAL.contains(region))
        putBoolean("isRTL", isRTL)
        putString("locale", localeNames[0])
        putStringArrayList("locales", localeNames)
        putString("region", region)
        putString("timezone", TimeZone.getDefault().id)
      }
    }

  private val locales: ArrayList<Locale>
    get() {
      val context = appContext.reactContext ?: return ArrayList()
      val configuration = context.resources.configuration
      return if (VERSION.SDK_INT > VERSION_CODES.N) {
        val locales = ArrayList<Locale>()
        for (i in 0 until configuration.locales.size()) {
          locales.add(configuration.locales[i])
        }
        locales
      } else {
        arrayListOf(configuration.locale)
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
}

/**
 * Creates a shallow [Map] from the [Bundle]. Does not traverse nested arrays and bundles.
 */
private fun Bundle.toMap(): Map<String, Any?> {
  val map = HashMap<String, Any?>()
  for (key in this.keySet()) {
    map[key] = this[key]
  }
  return map
}
