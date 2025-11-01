package expo.modules.devmenu.helpers

import android.content.SharedPreferences
import androidx.core.content.edit
import kotlin.reflect.KProperty

fun preferences(
  preferences: SharedPreferences,
  defaultValue: Boolean = false
) = SharedPreferencesDelegate(preferences, defaultValue)

class SharedPreferencesDelegate(
  private val preferences: SharedPreferences,
  private val defaultValue: Boolean
) {
  operator fun getValue(thisRef: Any?, property: KProperty<*>): Boolean {
    return preferences.getBoolean(property.name, defaultValue)
  }

  operator fun setValue(thisRef: Any?, property: KProperty<*>, value: Boolean) {
    preferences.edit(commit = true) {
      putBoolean(property.name, value)
    }
  }
}
