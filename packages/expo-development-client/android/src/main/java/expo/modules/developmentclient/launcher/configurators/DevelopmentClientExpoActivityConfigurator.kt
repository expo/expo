package expo.modules.developmentclient.launcher.configurators

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.pm.ActivityInfo
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Build
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import androidx.annotation.UiThread
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.ViewCompat
import com.facebook.react.ReactActivity
import expo.modules.developmentclient.helpers.RGBAtoARGB
import expo.modules.developmentclient.helpers.isValidColor
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientManifest
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientOrientation
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientStatusBarStyle
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientUserInterface

class DevelopmentClientExpoActivityConfigurator(
  private var manifest: DevelopmentClientManifest,
  private val context: Context
) {
  fun applyTaskDescription(activity: Activity) {
    if (!isValidColor(manifest.primaryColor)) {
      return
    }
    val color = Color.parseColor(manifest.primaryColor)
    val icon = BitmapFactory.decodeResource(context.resources, context.applicationInfo.icon)

    activity.setTaskDescription(ActivityManager.TaskDescription(
      manifest.name,
      icon,
      color
    ))
  }

  fun applyOrientation(activity: ReactActivity) {
    when (manifest.orientation) {
      DevelopmentClientOrientation.DEFAULT -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      DevelopmentClientOrientation.PORTRAIT -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      DevelopmentClientOrientation.LANDSCAPE -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
      else -> activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }
  }

  fun applyUiMode(activity: ReactActivity) {
    val uiMode = manifest
      .userInterfaceStyle
      ?.let {
        when (it) {
          DevelopmentClientUserInterface.AUTOMATIC -> {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
              AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY
            } else AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
          }
          DevelopmentClientUserInterface.DARK -> AppCompatDelegate.MODE_NIGHT_YES
          DevelopmentClientUserInterface.LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
        }
      } ?: AppCompatDelegate.MODE_NIGHT_NO
    activity.delegate.localNightMode = uiMode
  }

  fun applyStatusBarConfiguration(activity: ReactActivity) {
    val style = manifest.androidStatusBar?.barStyle
    val backgroundColor = manifest.androidStatusBar?.backgroundColor
    val translucent = manifest.androidStatusBar?.translucent ?: true
    val hidden = manifest.androidStatusBar?.hidden ?: false

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
        if (appliedStyle == DevelopmentClientStatusBarStyle.LIGHT) {
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
  private fun setStyle(style: DevelopmentClientStatusBarStyle?, activity: Activity): DevelopmentClientStatusBarStyle {
    var appliedStatusBarStyle = DevelopmentClientStatusBarStyle.LIGHT
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val decorView = activity.window.decorView
      var systemUiVisibilityFlags = decorView.systemUiVisibility
      when (style) {
        DevelopmentClientStatusBarStyle.LIGHT -> {
          systemUiVisibilityFlags = systemUiVisibilityFlags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
          appliedStatusBarStyle = DevelopmentClientStatusBarStyle.LIGHT
        }
        DevelopmentClientStatusBarStyle.DARK -> {
          systemUiVisibilityFlags = systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
          appliedStatusBarStyle = DevelopmentClientStatusBarStyle.DARK
        }
        else -> {
          systemUiVisibilityFlags = systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
          appliedStatusBarStyle = DevelopmentClientStatusBarStyle.DARK
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
          defaultInsets.systemWindowInsetBottom)
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
}
