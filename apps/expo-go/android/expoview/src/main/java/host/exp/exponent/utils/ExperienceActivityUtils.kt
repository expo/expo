// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import expo.modules.manifests.core.Manifest
import android.app.Activity
import android.content.pm.ActivityInfo
import android.view.WindowManager
import host.exp.exponent.ExponentManifest
import host.exp.exponent.ExponentManifest.BitmapListener
import android.graphics.Bitmap
import android.app.ActivityManager.TaskDescription
import android.graphics.Color
import android.os.Build
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import host.exp.exponent.analytics.EXL

object ExperienceActivityUtils {
  private val TAG = ExperienceActivityUtils::class.java.simpleName

  fun updateOrientation(manifest: Manifest, activity: Activity) {
    val orientation = manifest.getOrientation()
    if (orientation == null) {
      activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      return
    }
    when (orientation) {
      "default" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      "portrait" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      "landscape" -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
    }
  }

  fun updateSoftwareKeyboardLayoutMode(manifest: Manifest, activity: Activity) {
    val keyboardLayoutMode = manifest.getAndroidKeyboardLayoutMode() ?: "resize"

    // It's only necessary to set this manually for pan, resize is the default for the activity.
    if (keyboardLayoutMode == "pan") {
      activity.window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN)
    }
  }

  // region user interface style - light/dark/automatic mode
  /**
   * Sets uiMode to according to what is being set in manifest.
   */
  fun overrideUiMode(manifest: Manifest, activity: AppCompatActivity) {
    val userInterfaceStyle = manifest.getAndroidUserInterfaceStyle() ?: "light"
    activity.delegate.localNightMode = nightModeFromString(userInterfaceStyle)
  }

  private fun nightModeFromString(userInterfaceStyle: String?): Int {
    return if (userInterfaceStyle == null) {
      AppCompatDelegate.MODE_NIGHT_NO
    } else {
      when (userInterfaceStyle) {
        "automatic" -> {
          if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY
          } else {
            AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
          }
        }
        "dark" -> AppCompatDelegate.MODE_NIGHT_YES
        "light" -> AppCompatDelegate.MODE_NIGHT_NO
        else -> AppCompatDelegate.MODE_NIGHT_NO
      }
    }
  }

  // endregion

  // region StatusBar configuration

  @Suppress("DEPRECATION")
  fun configureStatusBar(manifest: Manifest, activity: Activity) {
    val statusBarOptions = manifest.getAndroidStatusBarOptions() ?: return

    val style = statusBarOptions.optString("style")
    val hidden = statusBarOptions.optBoolean("hidden")

    activity.runOnUiThread {
      val window = activity.window

      // clear android:windowTranslucentStatus flag as Window is edge-to-edge
      window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)

      WindowInsetsControllerCompat(window, window.decorView).run {
        if (hidden) {
          hide(WindowInsetsCompat.Type.statusBars())
        }

        when (style) {
          "dark" -> isAppearanceLightStatusBars = true
          "light" -> isAppearanceLightStatusBars = false
        }
      }
    }
  }

  // endregion

  fun setTaskDescription(
    exponentManifest: ExponentManifest,
    manifest: Manifest,
    activity: Activity
  ) {
    val iconUrl = manifest.getIconUrl()
    val color = exponentManifest.getColorFromManifest(manifest)
    exponentManifest.loadIconBitmap(
      iconUrl,
      object : BitmapListener {
        override fun onLoadBitmap(bitmap: Bitmap?) {
          // This if statement is only needed so the compiler doesn't show an error.
          try {
            activity.setTaskDescription(
              TaskDescription(
                manifest.getName() ?: "",
                bitmap,
                color
              )
            )
          } catch (e: Throwable) {
            EXL.e(TAG, e)
          }
        }
      }
    )
  }

  @Suppress("DEPRECATION")
  fun setNavigationBar(manifest: Manifest, activity: Activity) {
    val navBarOptions = manifest.getAndroidNavigationBarOptions() ?: return

    val enforceContrast = navBarOptions.optBoolean("enforceContrast", true)
    val style = navBarOptions.optString("style")
    val hidden = navBarOptions.optBoolean("hidden")

    activity.runOnUiThread {
      val window = activity.window

      // clear android:windowTranslucentNavigation flag as Window is edge-to-edge
      window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        window.isNavigationBarContrastEnforced = enforceContrast
      }

      WindowInsetsControllerCompat(window, window.decorView).run {
        if (hidden) {
          hide(WindowInsetsCompat.Type.navigationBars())
        }

        when (style) {
          "dark" -> isAppearanceLightNavigationBars = true
          "light" -> isAppearanceLightNavigationBars = false
        }
      }
    }
  }

  fun setRootViewBackgroundColor(manifest: Manifest, rootView: View) {
    var colorString = manifest.getAndroidBackgroundColor()
    if (colorString == null || !ColorParser.isValid(colorString)) {
      colorString = "#ffffff"
    }
    try {
      val color = Color.parseColor(colorString)
      rootView.setBackgroundColor(color)
    } catch (e: Throwable) {
      EXL.e(TAG, e)
      rootView.setBackgroundColor(Color.WHITE)
    }
  }
}
