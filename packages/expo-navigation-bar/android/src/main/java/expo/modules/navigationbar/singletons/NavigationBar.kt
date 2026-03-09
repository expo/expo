package expo.modules.navigationbar.singletons

import android.app.Activity
import android.util.Log
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

object NavigationBar {
  private const val TAG = "NavigationBar"

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
}
