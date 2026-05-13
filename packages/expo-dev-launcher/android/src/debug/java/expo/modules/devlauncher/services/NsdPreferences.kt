package expo.modules.devlauncher.services

import android.app.Application
import android.content.Context.MODE_PRIVATE
import android.content.SharedPreferences
import expo.modules.devmenu.helpers.preferences
import expo.modules.devmenu.helpers.stringPreferences

private const val NSD_PREFERENCES = "expo.modules.devlauncher.nsd"

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
   * When enabled, only NSD services whose `androidPackage` TXT record matches
   * the current app's package name will be shown.
   */
  var filterByPackageName: Boolean
    by preferences(sharedPreferences, true)

  /**
   * When non-empty, only NSD services whose `slug` TXT record matches
   * this value will be shown.
   */
  var filterBySlug: String
    by stringPreferences(sharedPreferences, "")

  /**
   * When enabled, only NSD services whose `username` TXT record matches
   * the current logged-in user's username will be shown.
   */
  var filterByUsername: Boolean
    by preferences(sharedPreferences, false)
}
