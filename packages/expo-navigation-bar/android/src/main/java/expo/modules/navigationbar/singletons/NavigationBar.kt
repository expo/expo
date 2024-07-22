package expo.modules.navigationbar.singletons

import android.app.Activity
import android.os.Build
import android.util.Log
import android.view.View
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

object NavigationBar {
  private const val TAG = "NavigationBar"

  fun setBackgroundColor(
    activity: Activity,
    color: Int,
    successCallback: () -> Unit
  ) {
    activity.window.navigationBarColor = color
    successCallback()
  }

  fun setButtonStyle(
    activity: Activity,
    buttonStyle: String,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
      when (buttonStyle) {
        // TODO: force dark mode
        // TODO: Maybe use auto instead of dark
        "light" -> controller.isAppearanceLightNavigationBars = false
        "dark" -> controller.isAppearanceLightNavigationBars = true
        else -> {
          failureCallback("Invalid style: \"$buttonStyle\"")
          return@let
        }
      }
      successCallback()
    }
  }

  fun setBorderColor(
    activity: Activity,
    color: Int,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      activity.window.navigationBarDividerColor = color
      successCallback()
    } else {
      failureCallback("'setBorderColorAsync' is only available on Android API 28 or higher")
    }
  }

  @JvmStatic
  fun setBorderColor(activity: Activity, color: Int) {
    setBorderColor(activity, color, {}, { m -> Log.e(TAG, m) })
  }

  fun setVisibility(
    activity: Activity,
    visibility: String,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
      when (visibility) {
        "visible" -> {
          controller.show(WindowInsetsCompat.Type.navigationBars())
        }
        "hidden" -> {
          controller.hide(WindowInsetsCompat.Type.navigationBars())
        }
        else -> return failureCallback("Invalid visibility: \"$visibility\"")
      }
      successCallback()
    }
  }

  @JvmStatic
  fun setVisibility(activity: Activity, visibility: String) {
    setVisibility(activity, visibility, {}, { m -> Log.e(TAG, m) })
  }

  fun setPosition(
    activity: Activity,
    position: String,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    var fits = when (position) {
      "absolute" -> {
        false
      }
      "relative" -> {
        true
      }
      else -> {
        return failureCallback("Invalid position: \"$position\"")
      }
    }

    WindowCompat.setDecorFitsSystemWindows(activity.window, fits)

    // This is a bit of a hack to ensure that we can read the property later with `unstable_getPositionAsync`
    activity.window.decorView.fitsSystemWindows = fits

    successCallback()
  }

  @JvmStatic
  fun setPosition(activity: Activity, position: String) {
    setPosition(activity, position, {}, { m -> Log.e(TAG, m) })
  }

  fun setBehavior(
    activity: Activity,
    behavior: String,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    WindowInsetsControllerCompat(activity.window, activity.window.decorView).let { controller ->
      when (behavior) {
        // TODO: Maybe relative / absolute
        "overlay-swipe" -> {
          controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        "inset-swipe" -> {
          controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE
        }
        "inset-touch" -> {
          controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH
        }
        else -> return failureCallback("Invalid behavior: \"$behavior\"")
      }
      successCallback()
    }
  }

  @JvmStatic
  fun setBehavior(activity: Activity, behavior: String) {
    setBehavior(activity, behavior, {}, { m -> Log.e(TAG, m) })
  }

  @Suppress("DEPRECATION")
  fun setLegacyVisible(
    activity: Activity,
    visible: String,
    successCallback: () -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    val decorView = activity.window.decorView
    var flags = decorView.systemUiVisibility
    when (visible) {
      "leanback" ->
        flags =
          flags or (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN)
      "immersive" ->
        flags =
          flags or (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE)
      "sticky-immersive" ->
        flags =
          flags or (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
      else -> return failureCallback("Invalid behavior: \"$visible\"")
    }
    decorView.systemUiVisibility = flags
    successCallback()
  }

  @JvmStatic
  fun setLegacyVisible(activity: Activity, visible: String) {
    setBehavior(activity, visible, {}, { m -> Log.e(TAG, m) })
  }
}
