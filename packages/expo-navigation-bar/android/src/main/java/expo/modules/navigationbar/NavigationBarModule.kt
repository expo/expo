package expo.modules.navigationbar

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.navigationbar.singletons.NavigationBar

class NavigationBarModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoNavigationBar")

    Events(VISIBILITY_EVENT_NAME)

    AsyncFunction("setBackgroundColorAsync") { color: Int, promise: Promise ->
      safeRunOnUiThread {
        NavigationBar.setBackgroundColor(it, color, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
      }
    }

    AsyncFunction("getBackgroundColorAsync") { promise: Promise ->
      safeRunOnUiThread {
        val color = colorToHex(it.window.navigationBarColor)
        promise.resolve(color)
      }
    }

    AsyncFunction("setBorderColorAsync") { color: Int, promise: Promise ->
      safeRunOnUiThread {
        NavigationBar.setBorderColor(it, color, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
      }
    }

    AsyncFunction("getBorderColorAsync") { promise: Promise ->
      safeRunOnUiThread {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          val color = colorToHex(it.window.navigationBarDividerColor)
          promise.resolve(color)
        } else {
          promise.reject(NavigationBarException("'getBorderColorAsync' is only available on Android API 28 or higher"))
        }
      }
    }

    AsyncFunction("setButtonStyleAsync") { buttonStyle: String, promise: Promise ->
      safeRunOnUiThread {
        NavigationBar.setButtonStyle(
          it, buttonStyle,
          {
            promise.resolve(null)
          },
          { m -> promise.reject(NavigationBarException(m)) }
        )
      }
    }

    AsyncFunction("getButtonStyleAsync") { promise: Promise ->
      safeRunOnUiThread {
        WindowInsetsControllerCompat(it.window, it.window.decorView).let { controller ->
          val style = if (controller.isAppearanceLightNavigationBars) "dark" else "light"
          promise.resolve(style)
        }
      }
    }

    AsyncFunction("setVisibilityAsync") { visibility: String, promise: Promise ->
      safeRunOnUiThread {
        NavigationBar.setVisibility(it, visibility, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
      }
    }

    AsyncFunction("getVisibilityAsync") { promise: Promise ->
      safeRunOnUiThread {
        val isVisible = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          it.window.decorView.rootWindowInsets.isVisible(WindowInsets.Type.navigationBars())
        } else {
          @Suppress("DEPRECATION")
          (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION and it.window.decorView.systemUiVisibility) == 0
        }
        val visibility = if (isVisible) "visible" else "hidden"
        promise.resolve(visibility)
      }
    }

    AsyncFunction("setPositionAsync") { position: String, promise: Promise ->
      safeRunOnUiThread {
        NavigationBar.setPosition(it, position, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
      }
    }

    AsyncFunction("unstable_getPositionAsync") { promise: Promise ->
      safeRunOnUiThread {
        val position = if (ViewCompat.getFitsSystemWindows(it.window.decorView)) "relative" else "absolute"
        promise.resolve(position)
      }
    }

    AsyncFunction("setBehaviorAsync") { behavior: String, promise: Promise ->
      safeRunOnUiThread {
        NavigationBar.setBehavior(it, behavior, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
      }
    }

    AsyncFunction("getBehaviorAsync") { promise: Promise ->
      safeRunOnUiThread {
        WindowInsetsControllerCompat(it.window, it.window.decorView).let { controller ->
          val behavior = when (controller.systemBarsBehavior) {
            // TODO: Maybe relative / absolute
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE -> "overlay-swipe"
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE -> "inset-swipe"
            // WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH -> "inset-touch"
            else -> "inset-touch"
          }
          promise.resolve(behavior)
        }
      }
    }

    OnStartObserving {
      safeRunOnUiThread {
        val decorView = it.window.decorView
        @Suppress("DEPRECATION")
        decorView.setOnSystemUiVisibilityChangeListener { visibility: Int ->
          val isNavigationBarVisible = (visibility and View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0
          val stringVisibility = if (isNavigationBarVisible) "visible" else "hidden"
          sendEvent(
            VISIBILITY_EVENT_NAME,
            Bundle().apply {
              putString("visibility", stringVisibility)
              putInt("rawVisibility", visibility)
            }
          )
        }
      }
    }

    OnStopObserving {
      safeRunOnUiThread {
        val decorView = it.window.decorView
        @Suppress("DEPRECATION")
        decorView.setOnSystemUiVisibilityChangeListener(null)
      }
    }
  }

  // Ensure that rejections are passed up to JS rather than terminating the native client.
  private fun safeRunOnUiThread(block: (activity: Activity) -> Unit) {
    val activity = appContext.currentActivity
      ?: throw Exceptions.MissingActivity()
    activity.runOnUiThread {
      block(activity)
    }
  }

  companion object {
    private const val VISIBILITY_EVENT_NAME = "ExpoNavigationBar.didChange"

    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
