package abi49_0_0.host.exp.exponent.modules.universal

import android.content.Context
import host.exp.exponent.utils.ScopedContext
import android.content.SharedPreferences
import android.util.Log
import abi49_0_0.expo.modules.securestore.SecureStoreModule
import host.exp.exponent.Constants

private const val SHARED_PREFERENCES_NAME = "SecureStore"

class ScopedSecureStoreModule(private val scopedContext: ScopedContext) :
  SecureStoreModule(if (Constants.isStandaloneApp()) scopedContext.baseContext else scopedContext) {

  // In standalone apps on SDK 41 and below, SecureStore was initiated with scoped context,
  // so SharedPreferences was scoped to that particular experienceId. This meant you
  // would lose data upon ejecting to bare. With this method, we can migrate apps' SecureStore
  // data from the scoped SharedPreferences SecureStore file, to unscoped, so data will persist
  // even after ejecting.
  private fun maybeMigrateSharedPreferences() {
    val prefs = super.getSharedPreferences()
    val legacyPrefs = scopedSharedPreferences
    val shouldMigratePreferencesData = Constants.isStandaloneApp() && prefs.all.isEmpty() && legacyPrefs.all.isNotEmpty()
    if (shouldMigratePreferencesData) {
      for ((key, value) in legacyPrefs.all) {
        val success = prefs.edit().putString(key, value.toString()).commit()
        if (!success) {
          Log.e("E_SECURESTORE_WRITE_ERROR", "Could not transfer SecureStore data to new storage.")
        }
      }
    }
  }

  private val scopedSharedPreferences: SharedPreferences
    get() = scopedContext.getSharedPreferences(
      SHARED_PREFERENCES_NAME,
      Context.MODE_PRIVATE
    )

  init {
    maybeMigrateSharedPreferences()
  }
}
