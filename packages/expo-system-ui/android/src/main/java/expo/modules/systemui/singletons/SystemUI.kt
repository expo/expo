package expo.modules.systemui.singletons

import android.app.Activity
import android.content.res.Configuration
import android.content.res.Resources
import android.graphics.Color
import android.os.Build
import android.util.Log
import android.view.WindowManager
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.systemui.R

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

  private fun detectDarkMode(resources: Resources) =
    resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES

  @JvmStatic
  fun enableEdgeToEdge(activity: Activity) {
    activity.runOnUiThread {
      val window = activity.window
      val view = window.decorView
      val context = view.context
      val isDarkMode = detectDarkMode(view.resources)

      WindowCompat.setDecorFitsSystemWindows(window, false)

      window.statusBarColor = Color.TRANSPARENT

      window.navigationBarColor = when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q -> Color.TRANSPARENT
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !isDarkMode -> ContextCompat.getColor(context, R.color.systemBarLightScrim)
        else -> ContextCompat.getColor(context, R.color.systemBarDarkScrim)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        window.isStatusBarContrastEnforced = false
        window.isNavigationBarContrastEnforced = true
      }

      WindowInsetsControllerCompat(window, view).run {
        isAppearanceLightStatusBars = !isDarkMode
        isAppearanceLightNavigationBars = !isDarkMode
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        window.attributes.layoutInDisplayCutoutMode = when {
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
          else -> WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
      }
    }
  }
}
