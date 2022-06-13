package expo.modules.localization

import android.os.Bundle
import android.view.View
import android.text.TextUtils
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES
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
