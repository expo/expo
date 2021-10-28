package expo.modules.systemui

import android.app.Activity
import android.os.Build
import android.util.Log
import android.view.View
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.interfaces.SingletonModule

object SystemUI : SingletonModule {
  private const val TAG = "SystemUI"

  override fun getName(): String {
    return "SystemUI"
  }

  private fun nightModeFromString(userInterfaceStyle: String?): Int {
    return if (userInterfaceStyle == null) {
      AppCompatDelegate.MODE_NIGHT_NO
    } else when (userInterfaceStyle) {
      "automatic" -> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
          AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY
        } else AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
      }
      "dark" -> AppCompatDelegate.MODE_NIGHT_YES
      "light" -> AppCompatDelegate.MODE_NIGHT_NO
      else -> AppCompatDelegate.MODE_NIGHT_NO
    }
  }

  fun setUserInterfaceStyle(
    style: String,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit) {

    AppCompatDelegate.setDefaultNightMode(nightModeFromString(style))
    successCallback()
  }

  @JvmStatic
  fun setUserInterfaceStyle(style: String) {
    setUserInterfaceStyle(style, {}, { m -> Log.e(TAG, m) })
  }

}
