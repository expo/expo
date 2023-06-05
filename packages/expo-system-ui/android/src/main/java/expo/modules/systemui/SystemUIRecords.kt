package expo.modules.systemui

import androidx.appcompat.app.AppCompatDelegate

enum class Theme(val value: String) {
  DARK("dark"),
  LIGHT("light"),
  AUTO("auto");

  fun toInterfaceStyle() = when (this) {
    AUTO -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
    LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
    DARK -> AppCompatDelegate.MODE_NIGHT_YES
  }
}