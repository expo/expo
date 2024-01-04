// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import expo.modules.manifests.core.Manifest
import android.app.Activity
import android.content.pm.ActivityInfo
import android.view.WindowManager
import host.exp.exponent.ExponentManifest
import android.view.WindowInsets
import host.exp.exponent.ExponentManifest.BitmapListener
import android.graphics.Bitmap
import android.app.ActivityManager.TaskDescription
import android.graphics.Color
import android.os.Build
import android.view.View
import androidx.annotation.UiThread
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.ViewCompat
import expo.modules.jsonutils.getNullable
import host.exp.exponent.analytics.EXL

object ExperienceActivityUtils {
  private val TAG = ExperienceActivityUtils::class.java.simpleName

  private const val STATUS_BAR_STYLE_DARK_CONTENT = "dark-content"
  private const val STATUS_BAR_STYLE_LIGHT_CONTENT = "light-content"

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

  /**
   * React Native is not using flag [WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS] nor view/manifest attribute 'android:windowTranslucentStatus'
   * (https://developer.android.com/reference/android/view/WindowManager.LayoutParams.html#FLAG_TRANSLUCENT_STATUS)
   * (https://developer.android.com/reference/android/R.attr.html#windowTranslucentStatus)
   * Instead it's using [WindowInsets] to limit available space on the screen ([com.facebook.react.modules.statusbar.StatusBarModule.setTranslucent]).
   *
   *
   * In case 'android:'windowTranslucentStatus' is used in activity's theme, it has to be removed in order to make RN's Status Bar API work.
   * Out approach to achieve translucency of StatusBar has to be aligned with RN's approach to ensure [com.facebook.react.modules.statusbar.StatusBarModule] works.
   *
   *
   * Links to follow in case of need of more detailed understating.
   * https://chris.banes.dev/talks/2017/becoming-a-master-window-fitter-lon/
   * https://www.youtube.com/watch?v=_mGDMVRO3iE
   */
  fun configureStatusBar(manifest: Manifest, activity: Activity) {
    val statusBarOptions = manifest.getAndroidStatusBarOptions()
    val statusBarStyle = statusBarOptions?.getNullable<String>(ExponentManifest.MANIFEST_STATUS_BAR_APPEARANCE)
    val statusBarBackgroundColor = statusBarOptions?.getNullable<String>(ExponentManifest.MANIFEST_STATUS_BAR_BACKGROUND_COLOR)

    val statusBarHidden = statusBarOptions != null && statusBarOptions.optBoolean(
      ExponentManifest.MANIFEST_STATUS_BAR_HIDDEN,
      false
    )
    val statusBarTranslucent = statusBarOptions == null || statusBarOptions.optBoolean(
      ExponentManifest.MANIFEST_STATUS_BAR_TRANSLUCENT,
      true
    )

    activity.runOnUiThread {
      // clear android:windowTranslucentStatus flag from Window as RN achieves translucency using WindowInsets
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)

      setHidden(statusBarHidden, activity)

      setTranslucent(statusBarTranslucent, activity)

      val appliedStatusBarStyle = setStyle(statusBarStyle, activity)

      // Color passed from manifest is in format '#RRGGBB(AA)' and Android uses '#AARRGGBB'
      val normalizedStatusBarBackgroundColor = RGBAtoARGB(statusBarBackgroundColor)

      if (normalizedStatusBarBackgroundColor == null || !ColorParser.isValid(normalizedStatusBarBackgroundColor)) {
        // backgroundColor is invalid or not set
        if (appliedStatusBarStyle == STATUS_BAR_STYLE_LIGHT_CONTENT) {
          // appliedStatusBarStyle is "light-content" so background color should be semi transparent black
          setColor(Color.parseColor("#88000000"), activity)
        } else {
          // otherwise it has to be transparent
          setColor(Color.TRANSPARENT, activity)
        }
      } else {
        setColor(Color.parseColor(normalizedStatusBarBackgroundColor), activity)
      }
    }
  }

  /**
   * If the string conforms to the "#RRGGBBAA" format then it's converted into the "#AARRGGBB" format.
   * Otherwise noop.
   */
  private fun RGBAtoARGB(rgba: String?): String? {
    if (rgba == null) {
      return null
    }
    return if (rgba.startsWith("#") && rgba.length == 9) {
      "#" + rgba.substring(7, 9) + rgba.substring(1, 7)
    } else {
      rgba
    }
  }

  @UiThread
  fun setColor(color: Int, activity: Activity) {
    activity
      .window
      .addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
    activity
      .window.statusBarColor = color
  }

  @UiThread
  fun setTranslucent(translucent: Boolean, activity: Activity) {
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

  /**
   * @return Effective style that is actually applied to the status bar.
   */
  @UiThread
  private fun setStyle(style: String?, activity: Activity): String {
    var appliedStatusBarStyle = STATUS_BAR_STYLE_LIGHT_CONTENT
    val decorView = activity.window.decorView
    var systemUiVisibilityFlags = decorView.systemUiVisibility
    when (style) {
      STATUS_BAR_STYLE_LIGHT_CONTENT -> {
        systemUiVisibilityFlags =
          systemUiVisibilityFlags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
        appliedStatusBarStyle = STATUS_BAR_STYLE_LIGHT_CONTENT
      }
      STATUS_BAR_STYLE_DARK_CONTENT -> {
        systemUiVisibilityFlags = systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        appliedStatusBarStyle = STATUS_BAR_STYLE_DARK_CONTENT
      }
      else -> {
        systemUiVisibilityFlags = systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        appliedStatusBarStyle = STATUS_BAR_STYLE_DARK_CONTENT
      }
    }
    decorView.systemUiVisibility = systemUiVisibilityFlags

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

  fun setNavigationBar(manifest: Manifest, activity: Activity) {
    val navBarOptions = manifest.getAndroidNavigationBarOptions() ?: return

    // Set background color of navigation bar
    val navBarColor = navBarOptions.getNullable<String>(ExponentManifest.MANIFEST_NAVIGATION_BAR_BACKGROUND_COLOR)
    if (navBarColor != null && ColorParser.isValid(navBarColor)) {
      try {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
        activity.window.navigationBarColor = Color.parseColor(navBarColor)
      } catch (e: Throwable) {
        EXL.e(TAG, e)
      }
    }

    // Set icon color of navigation bar
    val navBarAppearance = navBarOptions.getNullable<String>(ExponentManifest.MANIFEST_NAVIGATION_BAR_APPEARANCE)
    if (navBarAppearance != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
        if (navBarAppearance == "dark-content") {
          val decorView = activity.window.decorView
          var flags = decorView.systemUiVisibility
          flags = flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
          decorView.systemUiVisibility = flags
        }
      } catch (e: Throwable) {
        EXL.e(TAG, e)
      }
    }

    // Set visibility of navigation bar
    val navBarVisible = navBarOptions.getNullable<String>(ExponentManifest.MANIFEST_NAVIGATION_BAR_VISIBLILITY)
    if (navBarVisible != null) {
      // Hide both the navigation bar and the status bar. The Android docs recommend, "you should
      // design your app to hide the status bar whenever you hide the navigation bar."
      val decorView = activity.window.decorView
      var flags = decorView.systemUiVisibility
      when (navBarVisible) {
        "leanback" ->
          flags =
            flags or (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN)
        "immersive" ->
          flags =
            flags or (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE)
        "sticky-immersive" ->
          flags =
            flags or (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
      }
      decorView.systemUiVisibility = flags
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
