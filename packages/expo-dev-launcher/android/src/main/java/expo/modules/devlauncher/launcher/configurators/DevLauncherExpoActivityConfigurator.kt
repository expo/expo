package expo.modules.devlauncher.launcher.configurators

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.pm.ActivityInfo
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Build
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import androidx.annotation.UiThread
import androidx.core.view.ViewCompat
import com.facebook.react.ReactActivity
import expo.modules.devlauncher.helpers.RGBAtoARGB
import expo.modules.devlauncher.helpers.isValidColor
import expo.modules.devlauncher.launcher.manifest.DevLauncherNavigationBarStyle
import expo.modules.devlauncher.launcher.manifest.DevLauncherNavigationBarVisibility
import expo.modules.devlauncher.launcher.manifest.DevLauncherOrientation
import expo.modules.devlauncher.launcher.manifest.DevLauncherStatusBarStyle
import expo.modules.manifests.core.Manifest

class DevLauncherExpoActivityConfigurator(
  private var manifest: Manifest,
  private val context: Context
) {
  fun applyTaskDescription(activity: Activity) {
    if (!isValidColor(manifest.getPrimaryColor())) {
      return
    }
    val color = Color.parseColor(manifest.getPrimaryColor())
    val icon = BitmapFactory.decodeResource(context.resources, context.applicationInfo.icon)

    activity.setTaskDescription(
      ActivityManager.TaskDescription(
        manifest.getName(),
        icon,
        color
      )
    )
  }

  fun applyOrientation(activity: ReactActivity) {
    when (manifest.getOrientation()) {
      DevLauncherOrientation.DEFAULT -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      DevLauncherOrientation.PORTRAIT -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      DevLauncherOrientation.LANDSCAPE -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
      else -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }
  }

  fun applyStatusBarConfiguration(activity: ReactActivity) {
    val statusBarOptions = manifest.getAndroidStatusBarOptions()
    val style = statusBarOptions?.optString("barStyle")
    val backgroundColor = statusBarOptions?.optString("backgroundColor")
    val translucent = statusBarOptions == null || statusBarOptions.optBoolean("translucent", true)
    val hidden = statusBarOptions != null && statusBarOptions.optBoolean("hidden", false)

    activity.runOnUiThread {
      // clear android:windowTranslucentStatus flag from Window as RN achieves translucency using WindowInsets
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
      setHidden(hidden, activity)
      setTranslucent(translucent, activity)
      val appliedStyle = setStyle(style, activity)

      // Color passed from manifest is in format '#RRGGBB(AA)' and Android uses '#AARRGGBB'
      val normalizedStatusBarBackgroundColor = RGBAtoARGB(backgroundColor)

      val finalBackgroundColor = if (normalizedStatusBarBackgroundColor == null || !isValidColor(normalizedStatusBarBackgroundColor)) {
        // backgroundColor is invalid or not set
        if (appliedStyle == DevLauncherStatusBarStyle.LIGHT) {
          // appliedStatusBarStyle is "light-content" so background color should be semi transparent black
          Color.parseColor("#88000000")
        } else {
          // otherwise it has to be transparent
          Color.TRANSPARENT
        }
      } else {
        Color.parseColor(normalizedStatusBarBackgroundColor)
      }

      setColor(finalBackgroundColor, activity)
    }
  }

  @UiThread
  private fun setStyle(style: String?, activity: Activity): String {
    var appliedStatusBarStyle = DevLauncherStatusBarStyle.LIGHT
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val decorView = activity.window.decorView
      var systemUiVisibilityFlags = decorView.systemUiVisibility
      when (style) {
        DevLauncherStatusBarStyle.LIGHT -> {
          systemUiVisibilityFlags = systemUiVisibilityFlags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
          appliedStatusBarStyle = DevLauncherStatusBarStyle.LIGHT
        }
        DevLauncherStatusBarStyle.DARK -> {
          systemUiVisibilityFlags = systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
          appliedStatusBarStyle = DevLauncherStatusBarStyle.DARK
        }
        else -> {
          systemUiVisibilityFlags = systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
          appliedStatusBarStyle = DevLauncherStatusBarStyle.DARK
        }
      }
      decorView.systemUiVisibility = systemUiVisibilityFlags
    }
    return appliedStatusBarStyle
  }

  @UiThread
  private fun setHidden(hidden: Boolean, activity: Activity) {
    if (hidden) {
      activity.window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
    } else {
      activity.window.addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
    }
  }

  @UiThread
  private fun setTranslucent(translucent: Boolean, activity: Activity) {
    // If the status bar is translucent hook into the window insets calculations
    // and consume all the top insets so no padding will be added under the status bar.
    val decorView = activity.window.decorView
    if (translucent) {
      decorView.setOnApplyWindowInsetsListener { v: View, insets: WindowInsets? ->
        val defaultInsets = v.onApplyWindowInsets(insets)
        defaultInsets.replaceSystemWindowInsets(
          defaultInsets.systemWindowInsetLeft,
          0,
          defaultInsets.systemWindowInsetRight,
          defaultInsets.systemWindowInsetBottom
        )
      }
    } else {
      decorView.setOnApplyWindowInsetsListener(null)
    }
    ViewCompat.requestApplyInsets(decorView)
  }

  @UiThread
  fun setColor(color: Int, activity: Activity) {
    activity
      .window
      .addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
    activity
      .window.statusBarColor = color
  }

  fun applyNavigationBarConfiguration(activity: ReactActivity) {
    val navBarOptions = manifest.getAndroidNavigationBarOptions() ?: return

    // Set background color of navigation bar
    val navBarColor = navBarOptions.optString("backgroundColor")
    if (isValidColor(navBarColor)) {
      try {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
        activity.window.navigationBarColor = Color.parseColor(navBarColor)
      } catch (e: Throwable) {
        Log.e(TAG, "Failed to configure androidNavigationBar.backgroundColor", e)
      }
    }

    // Set icon color of navigation bar
    val navBarAppearance = navBarOptions.optString("barStyle")
    if (navBarAppearance != "" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
        if (navBarAppearance == DevLauncherNavigationBarStyle.DARK) {
          val decorView = activity.window.decorView
          var flags = decorView.systemUiVisibility
          flags = flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
          decorView.systemUiVisibility = flags
        }
      } catch (e: Throwable) {
        Log.e(TAG, "Failed to configure androidNavigationBar.barStyle", e)
      }
    }

    // Set visibility of navigation bar
    val navBarVisible = navBarOptions.optString("visible")
    if (navBarVisible != "") {
      // Hide both the navigation bar and the status bar. The Android docs recommend, "you should
      // design your app to hide the status bar whenever you hide the navigation bar."
      val decorView = activity.window.decorView
      val flags = decorView.systemUiVisibility or when (navBarVisible) {
        DevLauncherNavigationBarVisibility.LEANBACK -> (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN)
        DevLauncherNavigationBarVisibility.IMMERSIVE -> (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE)
        DevLauncherNavigationBarVisibility.STICKY_IMMERSIVE -> (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
        else -> 0
      }
      decorView.systemUiVisibility = flags
    }
  }

  companion object {
    private val TAG = DevLauncherExpoActivityConfigurator::class.java.simpleName
  }
}
