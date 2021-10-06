package expo.modules.localization

import android.os.Bundle
import android.view.View
import android.text.TextUtils
import android.content.Context
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES

import expo.modules.core.Promise
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.ExpoMethod

import kotlin.collections.ArrayList
import java.lang.ref.WeakReference
import java.text.DecimalFormatSymbols
import java.util.*

class LocalizationModule(context: Context) : ExportedModule(context) {
  private val contextRef: WeakReference<Context> = WeakReference(context)

  private val applicationContext: Context?
    get() = contextRef.get()?.applicationContext

  override fun getName() = "ExpoLocalization"

  override fun getConstants(): Map<String, Any> {
    val constants = HashMap<String, Any>()
    val bundle = bundledConstants
    for (key in bundle.keySet()) {
      constants[key] = bundle[key] as Any
    }
    return constants
  }

  @ExpoMethod
  fun getLocalizationAsync(promise: Promise) {
    promise.resolve(bundledConstants)
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
      val context = applicationContext ?: return ArrayList()
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
    } else getCountryCode(locale)
  }
}
