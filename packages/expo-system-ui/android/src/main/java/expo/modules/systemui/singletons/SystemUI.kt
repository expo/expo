package expo.modules.systemui.singletons

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.util.Log
import android.util.TypedValue
import android.view.WindowManager
import androidx.appcompat.app.AppCompatDelegate
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

  @JvmStatic
  fun enableEdgeToEdge(activity: Activity) {
    val typedValue = TypedValue()
    val window = activity.window
    val insetsController = WindowInsetsControllerCompat(window, window.decorView)

    val isAppearanceLightSystemBars = activity
      .theme
      .resolveAttribute(R.attr.windowLightSystemBars, typedValue, true)
        && typedValue.data != 0

    WindowCompat.setDecorFitsSystemWindows(window, false)

    activity.runOnUiThread {
      with(window) {
        statusBarColor = Color.TRANSPARENT
        insetsController.isAppearanceLightStatusBars = isAppearanceLightSystemBars

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
          navigationBarColor = Color.TRANSPARENT
          insetsController.isAppearanceLightNavigationBars = isAppearanceLightSystemBars

          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            isStatusBarContrastEnforced = false
            isNavigationBarContrastEnforced = false
          }

          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            attributes = attributes.apply {
              layoutInDisplayCutoutMode = when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ->
                  WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                else -> WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
              }
            }
          }
        } else {
          // The dark scrim color used in the platform.
          // https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/res/color/system_bar_background_semi_transparent.xml
          // https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/remote_color_resources_res/values/colors.xml;l=67
          navigationBarColor = Color.argb(0x80, 0x1b, 0x1b, 0x1b)
        }
      }
    }
  }
}
