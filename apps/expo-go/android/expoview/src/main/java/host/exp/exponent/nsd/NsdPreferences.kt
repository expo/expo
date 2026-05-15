package host.exp.exponent.nsd

import android.app.Application
import android.content.Context.MODE_PRIVATE
import android.content.SharedPreferences
import expo.modules.devmenu.helpers.stringPreferences

private const val NSD_PREFERENCES = "host.exp.exponent.nsd"

class NsdPreferences(application: Application) {
  private val sharedPreferences: SharedPreferences =
    application.getSharedPreferences(NSD_PREFERENCES, MODE_PRIVATE)

  private val listeners = mutableListOf<() -> Unit>()

  private val mainListener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
    listeners.forEach { it() }
  }

  init {
    sharedPreferences.registerOnSharedPreferenceChangeListener(mainListener)
  }

  fun addOnChangeListener(listener: () -> Unit) {
    listeners.add(listener)
  }

  fun removeOnChangeListener(listener: () -> Unit) {
    listeners.remove(listener)
  }

  /**
   * When non-empty, only NSD services whose `slug` TXT record matches
   * this value will be shown.
   */
  var filterBySlug: String
    by stringPreferences(sharedPreferences, "")
}
