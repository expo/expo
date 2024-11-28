package expo.modules.navigationbar

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.navigationbar.singletons.NavigationBar

class NavigationBarModule : Module() {
  private val currentActivity get() = appContext.throwingActivity

  override fun definition() = ModuleDefinition {
    Name("ExpoNavigationBar")

    Events(VISIBILITY_EVENT_NAME)

    OnStartObserving {
      val decorView = currentActivity.window.decorView
      decorView.post {
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
      val decorView = currentActivity.window.decorView
      decorView.post {
        @Suppress("DEPRECATION")
        decorView.setOnSystemUiVisibilityChangeListener(null)
      }
    }

    AsyncFunction("setBackgroundColorAsync") { color: Int, promise: Promise ->
      NavigationBar.setBackgroundColor(currentActivity, color) { promise.resolve(null) }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String>("getBackgroundColorAsync") {
      return@AsyncFunction colorToHex(currentActivity.window.navigationBarColor)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setBorderColorAsync") { color: Int, promise: Promise ->
      NavigationBar.setBorderColor(currentActivity, color, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String>("getBorderColorAsync") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        return@AsyncFunction colorToHex(currentActivity.window.navigationBarDividerColor)
      } else {
        throw NavigationBarException("'getBorderColorAsync' is only available on Android API 28 or higher")
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setButtonStyleAsync") { buttonStyle: String, promise: Promise ->
      NavigationBar.setButtonStyle(
        currentActivity,
        buttonStyle,
        {
          promise.resolve(null)
        },
        { m -> promise.reject(NavigationBarException(m)) }
      )
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String>("getButtonStyleAsync") {
      WindowInsetsControllerCompat(currentActivity.window, currentActivity.window.decorView).let { controller ->
        return@AsyncFunction if (controller.isAppearanceLightNavigationBars) "dark" else "light"
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setVisibilityAsync") { visibility: String, promise: Promise ->
      NavigationBar.setVisibility(currentActivity, visibility, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String>("getVisibilityAsync") {
      val isVisible = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        currentActivity.window.decorView.rootWindowInsets.isVisible(WindowInsets.Type.navigationBars())
      } else {
        @Suppress("DEPRECATION")
        (View.SYSTEM_UI_FLAG_HIDE_NAVIGATION and currentActivity.window.decorView.systemUiVisibility) == 0
      }
      return@AsyncFunction if (isVisible) "visible" else "hidden"
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setPositionAsync") { position: String, promise: Promise ->
      NavigationBar.setPosition(currentActivity, position, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String>("unstable_getPositionAsync") {
      return@AsyncFunction if (ViewCompat.getFitsSystemWindows(currentActivity.window.decorView)) "relative" else "absolute"
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setBehaviorAsync") { behavior: String, promise: Promise ->
      NavigationBar.setBehavior(currentActivity, behavior, { promise.resolve(null) }, { m -> promise.reject(NavigationBarException(m)) })
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<String>("getBehaviorAsync") {
      WindowInsetsControllerCompat(currentActivity.window, currentActivity.window.decorView).let { controller ->
        val behavior = when (controller.systemBarsBehavior) {
          // TODO: Maybe relative / absolute
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE -> "overlay-swipe"
          WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_SWIPE -> "inset-swipe"
          // WindowInsetsControllerCompat.BEHAVIOR_SHOW_BARS_BY_TOUCH -> "inset-touch"
          else -> "inset-touch"
        }

        return@AsyncFunction behavior
      }
    }.runOnQueue(Queues.MAIN)
  }

  companion object {
    private const val VISIBILITY_EVENT_NAME = "ExpoNavigationBar.didChange"

    fun colorToHex(color: Int): String {
      return String.format("#%02x%02x%02x", Color.red(color), Color.green(color), Color.blue(color))
    }
  }
}
