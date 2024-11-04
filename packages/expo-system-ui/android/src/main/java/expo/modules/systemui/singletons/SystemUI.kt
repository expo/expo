package expo.modules.systemui.singletons

import android.os.Build
import android.util.Log
import androidx.appcompat.app.AppCompatDelegate

object SystemUI {
  private const val TAG = "SystemUI"

  private fun setUserInterfaceStyle(
    style: String?,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    val mode = if (style == null) {
      AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
    } else {
      when (style) {
        "automatic" -> {
          if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY
          } else {
            AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
          }
        }
        "dark" -> AppCompatDelegate.MODE_NIGHT_YES
        "", "light" -> AppCompatDelegate.MODE_NIGHT_NO
        else -> return failureCallback("Invalid user interface style: \"$style\"")
      }
    }
    AppCompatDelegate.setDefaultNightMode(mode)
    successCallback()
  }

  @JvmStatic
  fun setUserInterfaceStyle(style: String) {
    setUserInterfaceStyle(style, {}, { m -> Log.e(TAG, m) })
  }
}
